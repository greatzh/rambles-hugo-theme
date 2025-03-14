// GitHub 风格贡献图表的脚本
document.addEventListener("DOMContentLoaded", function () {
  // 初始化年份选择器
  const yearSelector = document.getElementById("year-selector");

  // 从index.json获取数据
  fetch("/index.json")
    .then((response) => response.json())
    .then((data) => {
      // 过滤出碎碎念数据（根据section或其他标识）
      const rambleData = data.filter(
        (item) =>
          !["about", "posts", "all", "today"].includes(item.section) &&
          !item.hidden
      );

      // 转换为贡献热力图所需的格式
      const contributionData = processDataForContributionGraph(rambleData);

      // 添加年份选择器事件监听
      yearSelector.addEventListener("change", function () {
        renderContributionGraph(this.value, contributionData);
        updateContributionSummary(this.value, contributionData);
      });

      // 初始渲染贡献图
      const initialYear = "last365"; // 默认显示过去一年
      renderContributionGraph(initialYear, contributionData);
      updateContributionSummary(initialYear, contributionData);
    })
    .catch((error) => {
      console.error("获取数据失败:", error);
      // 显示错误信息
      document.getElementById("contribution-graph").innerHTML =
        '<div class="error-message">加载数据失败，请刷新页面重试</div>';
    });

  // 处理数据，转换为贡献热力图所需的格式
  function processDataForContributionGraph(data) {
    const contributionData = {};

    data.forEach((item) => {
      // 获取日期
      const date = new Date(item.date);
      const year = date.getFullYear().toString();
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      // 初始化年份数据
      if (!contributionData[year]) {
        contributionData[year] = {};
      }

      // 初始化日期数据
      if (!contributionData[year][dateStr]) {
        contributionData[year][dateStr] = {
          count: 0,
          posts: [],
        };
      }

      // 增加计数
      contributionData[year][dateStr].count++;

      // 添加文章信息
      contributionData[year][dateStr].posts.push({
        title: item.title,
        url: item.permalink,
        remark: item.remark || "",
        content: item.content ? item.content.substring(0, 200) + "..." : "", // 保留部分内容
      });
    });

    return contributionData;
  }

  // 更新年度统计信息
  function updateContributionSummary(year, contributionData) {
    const summaryElement = document.getElementById("contribution-summary");

    // 计算该年度的总碎碎念数量
    let totalCount = 0;

    if (year === "last365") {
      // 计算过去365天的总碎碎念数量
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);

      // 遍历所有年份的数据
      Object.keys(contributionData).forEach((yearKey) => {
        Object.keys(contributionData[yearKey]).forEach((dateStr) => {
          const date = new Date(dateStr);
          if (date >= oneYearAgo && date <= today) {
            totalCount += contributionData[yearKey][dateStr].count;
          }
        });
      });

      // 更新显示
      summaryElement.textContent = `过去一年有 ${totalCount} 条碎碎念`;
    } else {
      // 计算特定年份的总碎碎念数量
      if (contributionData[year]) {
        Object.values(contributionData[year]).forEach((dayData) => {
          totalCount += dayData.count;
        });
      }

      // 更新显示
      summaryElement.textContent = `${year}年 有 ${totalCount} 条碎碎念`;
    }
  }

  // 渲染贡献图
  function renderContributionGraph(year, contributionData) {
    const graphContainer = document.getElementById("contribution-graph");
    graphContainer.innerHTML = "";

    // 创建星期标签和日期单元格
    const weekdays = ["Sun", "Mon", "", "Wed", "", "Fri", ""];

    // 创建月份标签行
    const monthsRow = document.createElement("div");
    monthsRow.className = "months-row";

    // 添加空白单元格（对应星期标签列）
    const emptyCell = document.createElement("div");
    emptyCell.className = "month-label empty";
    monthsRow.appendChild(emptyCell);

    // 先添加到容器中
    graphContainer.appendChild(monthsRow);

    // 创建日期单元格行
    const rows = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const row = document.createElement("div");
      row.className = "contribution-row";

      // 添加星期标签
      const weekdayLabel = document.createElement("div");
      weekdayLabel.className = "weekday-label";
      weekdayLabel.textContent = weekdays[weekday];
      row.appendChild(weekdayLabel);

      rows.push(row);
      graphContainer.appendChild(row);
    }

    let firstDayOfYear, lastDayOfYear, totalWeeks;

    if (year === "last365") {
      // 过去一年的日期范围
      lastDayOfYear = new Date(); // 今天
      firstDayOfYear = new Date();
      firstDayOfYear.setDate(lastDayOfYear.getDate() - 365); // 365天前
    } else {
      // 特定年份的日期范围
      firstDayOfYear = new Date(`${year}-01-01`);
      lastDayOfYear = new Date(`${year}-12-31`);
    }

    // 计算第一天是星期几
    const firstDayWeekday = firstDayOfYear.getDay(); // 0 = 周日, 1 = 周一, ...

    // 计算总天数和总周数
    const totalDays =
      (lastDayOfYear - firstDayOfYear) / (24 * 60 * 60 * 1000) + 1;
    totalWeeks = Math.ceil((totalDays + firstDayWeekday) / 7);

    // 为每个月添加日期单元格
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthFirstWeek = {}; // 记录每个月第一天所在的周

    // 创建一个二维数组来存储每个位置的单元格
    const cellGrid = Array(7)
      .fill()
      .map(() => Array(totalWeeks).fill(null));

    // 填充单元格
    let currentDate = new Date(firstDayOfYear);
    const endDate = new Date(lastDayOfYear);

    while (currentDate <= endDate) {
      const month = currentDate.getMonth() + 1; // 1-12
      const day = currentDate.getDate();
      const weekday = currentDate.getDay(); // 0-6
      const currentYear = currentDate.getFullYear().toString();

      // 计算当前日期是第几周
      const dayOfYear =
        Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000)) + 1;
      const weekOfYear = Math.floor((dayOfYear + firstDayWeekday - 1) / 7);

      // 如果是每月第一天，记录其所在的周
      if (day === 1) {
        monthFirstWeek[`${currentYear}-${month}`] = weekOfYear;
      }

      // 创建单元格
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const yearOfDate = dateStr.substring(0, 4);
      const dayData =
        contributionData[yearOfDate] && contributionData[yearOfDate][dateStr];
      const count = dayData ? dayData.count : 0;

      const cell = document.createElement("div");
      cell.className = "contribution-cell";
      cell.dataset.date = dateStr;
      cell.dataset.count = count;

      // 根据文章数量设置颜色级别
      let colorLevel = 0;
      if (count > 0) {
        if (count <= 1) colorLevel = 1;
        else if (count <= 3) colorLevel = 2;
        else if (count <= 5) colorLevel = 3;
        else colorLevel = 4;
      }

      cell.classList.add(`level-${colorLevel}`);
      cell.style.backgroundColor = `var(--theme-color-level${colorLevel})`;

      // 添加点击事件
      if (count > 0) {
        cell.addEventListener("click", function () {
          showDayDetails(dateStr, count, dayData.posts);
        });
      }

      // 添加提示
      cell.title = `${dateStr}: ${count} 篇碎碎念`;

      // 将单元格存储到网格中
      cellGrid[weekday][weekOfYear] = cell;

      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 将单元格添加到行中
    for (let weekday = 0; weekday < 7; weekday++) {
      // 创建月份容器
      const monthContainer = document.createElement("div");
      monthContainer.className = "month-container";
      rows[weekday].appendChild(monthContainer);

      for (let week = 0; week < totalWeeks; week++) {
        const cell = cellGrid[weekday][week];
        if (cell) {
          monthContainer.appendChild(cell);
        } else {
          // 如果没有单元格，添加一个空白单元格保持对齐
          const emptyCell = document.createElement("div");
          emptyCell.className = "contribution-cell empty";
          monthContainer.appendChild(emptyCell);
        }
      }
    }

    // 添加月份标签
    // 如果是过去一年，需要显示跨年的月份标签
    const monthsToShow = new Set();
    let currentMonthDate = new Date(firstDayOfYear);
    while (currentMonthDate <= endDate) {
      const monthYear = `${currentMonthDate.getFullYear()}-${
        currentMonthDate.getMonth() + 1
      }`;
      monthsToShow.add(monthYear);
      // 移动到下个月
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    }

    // 添加月份标签
    monthsToShow.forEach((monthYear) => {
      const [yearStr, monthNum] = monthYear.split("-").map(Number);
      if (monthFirstWeek[monthYear] !== undefined) {
        const monthLabel = document.createElement("div");
        monthLabel.className = "month-label";
        monthLabel.textContent = months[monthNum - 1];
        monthLabel.dataset.month = monthYear;

        // 计算月份标签的位置
        const weekPosition = monthFirstWeek[monthYear];

        // 设置月份标签的位置
        const cellWidth = window.innerWidth <= 840 ? 12 : 18; // 移动设备上单元格宽度更小
        const labelOffset = window.innerWidth <= 840 ? 20 : 35; // 移动设备上标签偏移更小
        monthLabel.style.left = `${weekPosition * cellWidth + labelOffset}px`;

        // 将月份标签添加到月份行
        monthsRow.appendChild(monthLabel);
      }
    });

    // 添加窗口大小变化监听器，调整月份标签位置
    window.addEventListener("resize", function () {
      const monthLabels = document.querySelectorAll(".month-label[data-month]");
      monthLabels.forEach((label) => {
        const monthYear = label.dataset.month;
        const weekPosition = monthFirstWeek[monthYear];
        if (weekPosition !== undefined) {
          const cellWidth = window.innerWidth <= 840 ? 12 : 18;
          const labelOffset = window.innerWidth <= 840 ? 20 : 35;
          label.style.left = `${weekPosition * cellWidth + labelOffset}px`;
        }
      });
    });
  }

  // 显示某天的详细信息
  function showDayDetails(dateStr, count, posts) {
    const dayDetails = document.getElementById("day-details");
    const dayDetailsDate = document.getElementById("day-details-date");
    const dayDetailsCount = document.getElementById("day-details-count");
    const dayDetailsContent = document.getElementById("day-details-content");

    // 设置日期和文章数量
    const date = new Date(dateStr);
    const formattedDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    dayDetailsDate.textContent = formattedDate;
    dayDetailsCount.textContent = `${count} 条碎碎念`;

    // 清空并填充内容
    dayDetailsContent.innerHTML = "";
    posts.forEach((post) => {
      const postElement = document.createElement("div");
      postElement.className = "day-details-post";

      const postLink = document.createElement("a");
      postLink.href = post.url;

      // 去除标题中的双引号
      const cleanTitle = post.title.replace(/^"|"$/g, "");
      postLink.textContent = `#${cleanTitle}`;

      if (post.remark) {
        // 去除备注中的双引号
        const cleanRemark = post.remark.replace(/^"|"$/g, "");
        postLink.textContent += ` ${cleanRemark}`;
      }

      postElement.appendChild(postLink);

      // 如果有内容，显示内容预览
      if (post.content) {
        const contentPreview = document.createElement("div");
        contentPreview.className = "post-content-preview";
        contentPreview.textContent = post.content;
        postElement.appendChild(contentPreview);
      }

      dayDetailsContent.appendChild(postElement);
    });

    // 显示详情面板
    dayDetails.style.display = "block";

    // 滚动到详情面板
    dayDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

// 关闭详情面板
function closeDayDetails() {
  document.getElementById("day-details").style.display = "none";
}
