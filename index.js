d3.csv("data.csv", d3.autoType).then((csv) => {
  const data = csv.map((d) => ({
    occupation: d.occupation,
    data: csv.columns.slice(1).map((col) => d[col]),
  }));

  const maxValue = d3.max(data, (d) => d3.max(d.data));

  const scrollContainer = d3
    .select(".scroll")
    .on("focusindexchange", (event) => {
      handleFocusIndexChange(event.detail);
    });
  const stickyContainer = scrollContainer.select(".sticky");
  const stepsContainer = scrollContainer.select(".steps");

  const charts = data.map((d, i) => {
    if (i === 0) {
      return new WorkHoursChart({
        container: stickyContainer.append("div").attr("class", "step"),
        occupation: d.occupation,
        data: d.data,
        maxValue,
        type: "benchmark",
      });
    } else {
      return new WorkHoursChart({
        container: stepsContainer.append("div").attr("class", "step"),
        occupation: d.occupation,
        data: d.data,
        maxValue,
        type: "comparison",
      });
    }
  });

  function handleFocusIndexChange(focusIndex) {
    if (typeof focusIndex !== "number") {
      focusIndex = new Date().getHours();
    }
    charts.forEach((chart) => chart.focus(focusIndex));
  }

  handleFocusIndexChange();

  // Set up scroll snap when steps container is in view
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        scrollContainer.classed("visible", entry.isIntersecting);
      });
    },
    {
      rootMargin: "0px 0px -100% 0px",
    }
  ).observe(scrollContainer.node());
});
