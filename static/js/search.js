// 搜索功能实现
(function () {
  // 搜索配置
  const fuseOptions = {
    shouldSort: true,
    includeMatches: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      { name: "title", weight: 0.8 },
      { name: "description", weight: 0.5 },
      { name: "content", weight: 0.3 },
      { name: "remark", weight: 0.5 },
      { name: "categories", weight: 0.3 },
      { name: "permalink", weight: 0.2 }, // 添加permalink作为搜索字段
    ],
  };

  // 获取搜索索引
  fetch("/index.json")
    .then((response) => response.json())
    .then((data) => {
      // 预处理数据，确保所有字段都存在
      const processedData = data.map((item) => {
        // 确保所有项都有标题
        if (!item.title && item.permalink) {
          // 如果没有标题但有permalink，从permalink提取标题
          const pathParts = item.permalink.split("/").filter((p) => p);
          if (pathParts.length > 0) {
            item.title = pathParts[pathParts.length - 1];
          }
        }

        // 确保content字段存在
        if (!item.content) {
          item.content = "";
        }

        return item;
      });

      // 初始化 Fuse 搜索
      const fuse = new Fuse(processedData, fuseOptions);

      // 获取搜索输入框和结果容器
      const searchInput = document.getElementById("search-input");
      const searchResults = document.getElementById("search-results");

      if (!searchInput || !searchResults) {
        return;
      }

      // 监听输入事件
      searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.trim();

        // 清空结果容器
        searchResults.innerHTML = "";

        // 如果搜索词为空，不显示结果
        if (searchTerm === "") {
          return;
        }

        // 特殊处理：如果搜索词是纯数字，添加额外的处理
        let results;
        if (/^\d+$/.test(searchTerm)) {
          // 直接匹配标题或permalink中包含该数字的项
          const directMatches = processedData.filter(
            (item) =>
              item.title === searchTerm ||
              item.permalink.includes(`/${searchTerm}/`)
          );

          // 如果有直接匹配，优先显示这些结果
          if (directMatches.length > 0) {
            results = directMatches.map((item) => ({ item }));
          } else {
            // 否则使用Fuse进行模糊搜索
            results = fuse.search(searchTerm);
          }
        } else {
          // 非数字搜索使用Fuse进行搜索
          results = fuse.search(searchTerm);
        }

        // 显示结果
        if (results.length === 0) {
          searchResults.innerHTML =
            '<div class="search-no-results">没有找到相关结果</div>';
          return;
        }

        // 构建结果列表
        const resultsList = document.createElement("ul");
        resultsList.className = "search-results-list";

        // 最多显示30个结果
        // 按日期排序，最新的排在前面
        const sortedResults = [...results].sort((a, b) => {
          const dateA = a.item.date ? new Date(a.item.date) : new Date(0);
          const dateB = b.item.date ? new Date(b.item.date) : new Date(0);
          return dateB - dateA; // 降序排列，最新的在前
        });

        sortedResults.slice(0, 30).forEach((result) => {
          const item = result.item;

          const li = document.createElement("li");
          li.className = "search-result-item";

          const titleContainer = document.createElement("div");
          titleContainer.className = "search-result-title-container";

          const a = document.createElement("a");
          a.href = item.permalink;
          a.className = "search-result-title";

          // 标题显示
          let titleText = `#${item.title}` || "无标题";

          // 如果有备注，将备注添加到标题后面
          if (item.remark) {
            titleText += ` ${item.remark}`;
          }

          a.textContent = titleText;
          titleContainer.appendChild(a);

          const date = document.createElement("span");
          date.className = "search-result-date";
          date.textContent = item.date || "";

          const description = document.createElement("div");
          description.className = "search-result-description";

          // 直接显示内容预览
          const contentPreview = item.content
            ? item.content.substring(0, 100) + "..."
            : "";
          description.textContent = contentPreview;

          li.appendChild(titleContainer);
          li.appendChild(date);
          li.appendChild(description);
          resultsList.appendChild(li);
        });

        searchResults.appendChild(resultsList);
      });
    })
    .catch((error) => {
      const searchResults = document.getElementById("search-results");
      if (searchResults) {
        searchResults.innerHTML =
          '<div class="search-no-results">加载搜索索引失败，请刷新页面重试</div>';
      }
    });
})();
