#!/usr/bin/env python3
"""
戸建・土地のHTMLファイルに購入希望者情報の補足説明を追加するスクリプト
"""
import os
import re
from pathlib import Path

# 補足説明のHTML
SUPPLEMENT_HTML = '''
    <!-- 購入希望者情報の補足説明 -->
    <div style="background: #f9fafb; border: 1px solid #e1e4e8; border-radius: 8px; padding: 24px 20px; margin: 40px 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
        <div style="font-size: 16px; font-weight: 600; color: #24292e; margin-bottom: 16px; line-height: 1.6;">
            掲載外の購入希望者情報についても対応可能な場合があります
        </div>

        <div style="font-size: 14px; color: #24292e; line-height: 1.8; margin-bottom: 20px;">
            不動産業界では、購入希望者を抱えていても、高齢化やIT環境の制約、業務の多忙などの理由により、サイトへの登録が追いついていない不動産会社が多く存在します。<br><br>

            URICO関西では、このような提携・加盟不動産会社とも日常的に連携し、お客様の売却条件をもとに定期的なヒアリングを行っております。<br><br>

            そのため、サイト上に掲載されている購入希望者情報に加えて、掲載外の購入希望者についても、条件が一致すると判断した場合に限り、個別にご紹介できる場合がございます。<br><br>

            購入希望者情報はすべて匿名で管理されており、お客様からお問い合わせをいただいた際に、改めて詳細な条件確認と照合を行ったうえで、安全にマッチングをご案内いたします。
        </div>

        <div style="background: #ffffff; border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin: 20px 0; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #586069; line-height: 1.6; overflow-x: auto; white-space: pre;">┌─────────────────────┐
│ 掲載中の購入希望者    │
│   (サイト上で閲覧可能)  │
└──────┬──────────┘
         │
         ├───→  お客様の物件
         │
┌────┴─────────────┐
│ 掲載外の購入希望者    │
│ (提携先不動産会社保有)│
│  ※条件一致時のみ紹介  │
└─────────────────────┘</div>

        <div style="font-size: 13px; color: #586069; line-height: 1.6; padding: 12px 16px; background: #fffbdd; border-left: 3px solid #ffd33d; border-radius: 4px; margin-top: 16px;">
            ※掲載外の購入希望者のご紹介は、条件照合の結果によるものであり、必ずご紹介できることをお約束するものではございません。
        </div>
    </div>
'''

def add_supplement_to_html(file_path):
    """HTMLファイルに補足説明を追加する"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # すでに補足説明が追加されているかチェック
        if '掲載外の購入希望者情報についても対応可能な場合があります' in content:
            return False

        # buyer-grid の終了タグ </div> の後、container の終了タグ </div> の前に挿入
        # パターン: </div>（buyer-gridの終了）\n    </div>（containerの終了）
        pattern = r'(</div>\s*</div>\s*</body>)'

        # 補足説明を挿入
        replacement = SUPPLEMENT_HTML + r'\n    \1'

        new_content = re.sub(pattern, replacement, content, count=1)

        # 変更があった場合のみファイルを更新
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False

    except Exception as e:
        print(f"エラー: {file_path} - {e}")
        return False

def main():
    """メイン処理"""
    base_dirs = ['public/house', 'public/land']
    total_files = 0
    updated_files = 0

    for base_dir in base_dirs:
        if not os.path.exists(base_dir):
            print(f"{base_dir} が見つかりません")
            continue

        print(f"\n{base_dir} を処理中...")

        for html_file in Path(base_dir).rglob('*.html'):
            total_files += 1
            if add_supplement_to_html(html_file):
                updated_files += 1

            # 進捗表示（500ファイルごと）
            if total_files % 500 == 0:
                print(f"処理中: {total_files}件 (更新: {updated_files}件)")

    print(f"\n完了: {total_files}件処理、{updated_files}件更新")

if __name__ == '__main__':
    main()
