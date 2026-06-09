#!/usr/bin/env python3
"""
豆瓣增量同步脚本
- 爬取最新电影/书籍/音乐标记（只爬 collect 状态）
- 与现有数据合并，按 douban_id 去重，新条目追加
- 下载新增封面到本地
- 更新数据文件

用法: python3 sync_douban.py [movie|book|music|all]
"""
import csv
import json
import re
import sys
import time
import random
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urlparse

# ── 配置 ──────────────────────────────────────────────────────────────────────
COOKIE = 'bid=2g_AIhZxOrg; __utmc=30149280; ll="108296"; _vwo_uuid_v2=D09ED88BB8067B89B71A001B88B5BA967|6e8a336edeed6ced1e73199cc753a8ad; __utmv=30149280.16301; ap_v=0,6.0; __utma=30149280.552581787.1774593338.1775098713.1778057565.4; __utmz=30149280.1778057565.4.3.utmcsr=sec.douban.com|utmccn=(referral)|utmcmd=referral|utmcct=/; __utmt=1; dbcl2="163014212:MKUuDAXQELc"; ck=ujjU; push_noty_num=0; push_doumail_num=0; __utmb=30149280.5.10.1778057565; frodotk_db="a7a83cad2246389bf6f8b60766d2a9d1"'
USER_ID = "163014212"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Cookie": COOKIE,
    "Referer": "https://www.douban.com",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

BASE_DIR   = Path(__file__).parent
DATA_DIR   = BASE_DIR / "public" / "data"
COVERS_DIR = BASE_DIR / "public" / "covers"

RATING_PATTERN = re.compile(r"rating(\d)-t")

CSV_FIELDS = ["title", "douban_id", "douban_url", "cover", "rating", "date",
              "status", "status_label", "tags", "comment", "intro", "category"]

# ── 工具函数 ──────────────────────────────────────────────────────────────────

def parse_rating(item):
    for span in item.select("span[class]"):
        for cls in span.get("class", []):
            m = RATING_PATTERN.match(cls)
            if m:
                return m.group(1)
    return ""


def download_cover(url, dest_path):
    """下载封面图片，返回是否成功"""
    if not url or not url.startswith("http"):
        return False
    if dest_path.exists() and dest_path.stat().st_size > 500:
        return True
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200 and len(r.content) > 500:
            dest_path.write_bytes(r.content)
            return True
    except Exception:
        pass
    return False


def localize_cover(url, img_dir, url_prefix, douban_id):
    """下载封面并返回本地路径，失败则返回原 URL"""
    if not url or not url.startswith("http"):
        return url
    ext = Path(urlparse(url).path).suffix or ".jpg"
    filename = f"{douban_id}{ext}"
    dest = img_dir / filename
    if download_cover(url, dest):
        return url_prefix + filename
    return url  # 下载失败保留原链接


# ── 电影爬取 ──────────────────────────────────────────────────────────────────

def crawl_movies_page(start):
    """爬取一页电影标记，返回 (items, total)"""
    url = f"https://movie.douban.com/people/{USER_ID}/collect?start={start}&sort=time&rating=all&filter=all&mode=grid"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        return [], 0
    soup = BeautifulSoup(resp.text, "html.parser")

    total = 0
    num_span = soup.select_one(".subject-num")
    if num_span:
        try:
            total = int(num_span.get_text(strip=True).split("/")[-1].strip())
        except Exception:
            pass

    items = []
    for item in soup.select("div.item.comment-item"):
        try:
            link_el = item.select_one("a[href*='/subject/']")
            item_url = link_el.get("href", "") if link_el else ""
            douban_id = ""
            if "/subject/" in item_url:
                douban_id = item_url.split("/subject/")[1].rstrip("/").split("?")[0]

            title_el = item.select_one(".title em") or item.select_one(".title a")
            title = title_el.get_text(strip=True) if title_el else ""

            cover_el = item.select_one(".pic img")
            cover = cover_el.get("src", "") if cover_el else ""

            rating = parse_rating(item)
            date_el = item.select_one(".date")
            date = date_el.get_text(strip=True) if date_el else ""

            comment_el = item.select_one("p.comment")
            comment = comment_el.get_text(strip=True) if comment_el else ""

            items.append({
                "title": title, "title_cn": title,
                "douban_id": douban_id, "douban_url": item_url,
                "cover": cover, "rating": rating, "date": date,
                "status": "collect", "status_label": "看过",
                "comment": comment, "year": date[:4] if date else "",
                "genres": "", "director": "",
            })
        except Exception:
            continue
    return items, total


def sync_movies(existing_ids):
    """增量爬取电影，返回新增条目列表"""
    print("\n🎬 同步电影...")
    new_items = []
    start = 0
    total = None
    stop_early = False

    while not stop_early:
        items, page_total = crawl_movies_page(start)
        if total is None:
            total = page_total
            print(f"  豆瓣共 {total} 条")
        if not items:
            break

        for item in items:
            if item["douban_id"] in existing_ids:
                stop_early = True  # 遇到已有条目，停止
                break
            new_items.append(item)

        print(f"  已扫描 {start + len(items)} 条，新增 {len(new_items)} 条", end="\r", flush=True)
        start += 15
        if start >= total:
            break
        time.sleep(random.uniform(1.0, 2.0))

    print(f"\n  ✓ 新增电影: {len(new_items)} 条")
    return new_items


# ── 书籍/音乐爬取 ─────────────────────────────────────────────────────────────

def get_music_comment(item):
    """从音乐条目提取评论（跳过日期格式和评分 li）"""
    import re as _re
    date_pat = _re.compile(r'^\d{4}-\d{2}-\d{2}$')
    ul = item.select_one("div.info ul")
    if not ul:
        return ""
    for li in ul.find_all("li", recursive=False):
        if li.get("class"):
            continue
        if li.select_one("span[class*='rating']"):
            continue
        text = li.get_text(strip=True)
        # 跳过纯日期（标记日期会被误识别为评论）
        if date_pat.match(text):
            continue
        if text:
            return text
    return ""


CATEGORY_CONFIG = {
    "book": {
        "base_url": "https://book.douban.com/people/{uid}/collect",
        "item_selector": "li.subject-item",
        "title_selector": ".info h2 a",
        "cover_selector": ".pic img",
        "intro_selector": ".abstract",
        "comment_selector": "p.comment",
        "status_label": "读过",
    },
    "music": {
        "base_url": "https://music.douban.com/people/{uid}/collect",
        "item_selector": "div.item.comment-item",
        "title_selector": ".title a em",
        "cover_selector": ".pic img",
        "intro_selector": "li.intro",
        "comment_selector": None,  # 特殊处理
        "status_label": "听过",
    },
}


def crawl_csv_page(category, start):
    cfg = CATEGORY_CONFIG[category]
    url = cfg["base_url"].format(uid=USER_ID)
    url = f"{url}?start={start}&sort=time&rating=all&filter=all&mode=grid"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        return [], 0
    soup = BeautifulSoup(resp.text, "html.parser")

    total = 0
    num_span = soup.select_one(".subject-num")
    if num_span:
        try:
            total = int(num_span.get_text(strip=True).split("/")[-1].strip())
        except Exception:
            pass

    items = []
    for item in soup.select(cfg["item_selector"]):
        try:
            link_el = item.select_one("a[href*='/subject/']")
            item_url = link_el.get("href", "") if link_el else ""
            douban_id = ""
            if "/subject/" in item_url:
                douban_id = item_url.split("/subject/")[1].rstrip("/").split("?")[0]

            title_el = item.select_one(cfg["title_selector"])
            if not title_el:
                title_el = item.select_one(".info a") or item.select_one("a[href*='/subject/']")
            title = title_el.get_text(strip=True) if title_el else ""

            cover_el = item.select_one(cfg["cover_selector"])
            cover = cover_el.get("src", "") if cover_el else ""

            rating = parse_rating(item)
            date_el = item.select_one(".date")
            date = date_el.get_text(strip=True) if date_el else ""

            tags_el = item.select_one(".tags")
            tags = tags_el.get_text(strip=True).replace("标签:", "").strip() if tags_el else ""

            intro_el = item.select_one(cfg["intro_selector"])
            intro = intro_el.get_text(strip=True) if intro_el else ""

            if cfg["comment_selector"]:
                comment_el = item.select_one(cfg["comment_selector"])
                comment = comment_el.get_text(strip=True) if comment_el else ""
            else:
                comment = get_music_comment(item)

            items.append({
                "title": title, "douban_id": douban_id, "douban_url": item_url,
                "cover": cover, "rating": rating, "date": date,
                "status": "collect", "status_label": cfg["status_label"],
                "tags": tags, "comment": comment, "intro": intro,
                "category": category,
            })
        except Exception:
            continue
    return items, total


def sync_csv_category(category, existing_ids):
    cfg = CATEGORY_CONFIG[category]
    label = "书籍" if category == "book" else "音乐"
    print(f"\n{'📚' if category == 'book' else '🎵'} 同步{label}...")
    new_items = []
    start = 0
    total = None
    stop_early = False

    while not stop_early:
        items, page_total = crawl_csv_page(category, start)
        if total is None:
            total = page_total
            print(f"  豆瓣共 {total} 条")
        if not items:
            break

        for item in items:
            if item["douban_id"] in existing_ids:
                stop_early = True
                break
            new_items.append(item)

        print(f"  已扫描 {start + len(items)} 条，新增 {len(new_items)} 条", end="\r", flush=True)
        start += 15
        if start >= total:
            break
        time.sleep(random.uniform(1.0, 2.0))

    print(f"\n  ✓ 新增{label}: {len(new_items)} 条")
    return new_items


# ── 主流程 ────────────────────────────────────────────────────────────────────

def sync_movies_task():
    json_path = DATA_DIR / "movies.json"
    img_dir = COVERS_DIR / "movies"
    img_dir.mkdir(parents=True, exist_ok=True)

    existing = json.loads(json_path.read_text(encoding="utf-8")) if json_path.exists() else []
    existing_ids = {str(m.get("douban_id", "")) for m in existing}

    new_items = sync_movies(existing_ids)
    if not new_items:
        print("  无新增，跳过")
        return 0

    # 下载封面
    print(f"  下载 {len(new_items)} 张新封面...")
    for item in new_items:
        item["cover"] = localize_cover(item["cover"], img_dir, "/covers/movies/", item["douban_id"])
        time.sleep(random.uniform(0.05, 0.15))

    # 新条目插到最前面（最新的在前）
    merged = new_items + existing
    json_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  💾 movies.json 更新完成，总计 {len(merged)} 条")
    return len(new_items)


def sync_csv_task(category):
    csv_path = DATA_DIR / f"{'books' if category == 'book' else 'music'}.csv"
    img_dir = COVERS_DIR / ("books" if category == "book" else "music")
    img_dir.mkdir(parents=True, exist_ok=True)
    url_prefix = f"/covers/{'books' if category == 'book' else 'music'}/"

    existing = []
    if csv_path.exists():
        with open(csv_path, newline="", encoding="utf-8") as f:
            existing = list(csv.DictReader(f))
    existing_ids = {str(r.get("douban_id", "")) for r in existing}

    new_items = sync_csv_category(category, existing_ids)
    if not new_items:
        print("  无新增，跳过")
        return 0

    # 下载封面
    print(f"  下载 {len(new_items)} 张新封面...")
    for item in new_items:
        item["cover"] = localize_cover(item["cover"], img_dir, url_prefix, item["douban_id"])
        time.sleep(random.uniform(0.05, 0.15))

    # 新条目插到最前面
    merged = new_items + existing
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(merged)
    label = "books" if category == "book" else "music"
    print(f"  💾 {label}.csv 更新完成，总计 {len(merged)} 条")
    return len(new_items)


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target not in ["movie", "book", "music", "all"]:
        print("用法: python3 sync_douban.py [movie|book|music|all]")
        sys.exit(1)

    print("=" * 50)
    print("🔄 豆瓣增量同步开始")
    print("=" * 50)

    total_new = 0
    if target in ("movie", "all"):
        total_new += sync_movies_task()
    if target in ("book", "all"):
        total_new += sync_csv_task("book")
    if target in ("music", "all"):
        total_new += sync_csv_task("music")

    print("\n" + "=" * 50)
    if total_new > 0:
        print(f"✅ 同步完成，共新增 {total_new} 条内容")
    else:
        print("✅ 同步完成，暂无新内容")
    print("=" * 50)


if __name__ == "__main__":
    main()
