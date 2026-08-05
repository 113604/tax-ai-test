TAX AI 智慧搜尋示範版

已修改：
1. 智慧搜尋新增「快速搜尋」與「AI 智慧問答」雙頁籤。
2. AI 智慧問答會先檢索現有 questionBank.js，再整理最多 4 筆相關題庫。
3. 找不到足夠資料時，固定顯示資料庫無足夠資料，不自行推測。
4. 回答會列出引用題目，可點開查看完整標準答詢。
5. 修正 index.html 重複載入 app.js 與重複 body 標籤。

注意：
這一版是「前端題庫智慧整理示範版」，尚未串接真正生成式 AI API。
正式 RAG 仍需後端、語意向量搜尋及模型 API。

使用方式：
將 index.html、style.css、app.js、search.js、questionBank.js 上傳覆蓋 GitHub 對應檔案。
learningBank.js、圖片、Logo 等其他原有檔案請繼續保留。
