class WorkHoursChart {
  constructor({ container, occupation, data, maxValue, type }) {
    this.container = container;
    this.occupation = occupation;
    this.data = data;
    this.maxValue = maxValue;
    this.type = type;
    this.init();
  }

  init() {
    this.marginTop = 20;
    this.marginRight = 0;
    this.marginBottom = 40;
    this.marginLeft = 40;

    this.formatY = (d) => d + "%";
    this.formatX = (d) => {
      if (d === 0) return "12AM";
      if (d < 12) return d + "AM";
      if (d === 12) return "12PM";
      return d - 12 + "PM";
    };

    this.focusIndex = null;
    this.isBenchmark = this.type === "benchmark";
    this.id = `workHoursChart-${crypto.randomUUID()}`;

    this.x = d3.scaleLinear().domain([0, 24]);

    this.xTick = d3.scalePoint().domain(d3.range(24)).padding(0.5);

    this.formatXTick = (width) => {
      const counts = [4, 6, 12, 24];
      const stepWidth = 80;
      const i = d3.bisectLeft(counts, width / stepWidth);
      const step = 24 / counts[i];
      return (d) => (d % step === 0 ? this.formatX(d) : "");
    };

    this.y = d3.scaleLinear().domain([0, this.maxValue]).nice();

    this.area = d3
      .area()
      .x((d, i) => this.x(i))
      .y1((d) => this.y(d))
      .y0(() => this.y(0))
      .curve(d3.curveStepAfter);

    this.line = this.area.lineY1();

    this.chart = this.container
      .append("div")
      .attr("class", `chart ${this.type}`);

    this.header = this.chart.append("div").attr("class", "chart-header");
    this.focusValue = this.header
      .append("div")
      .call((div) =>
        div.append("div").attr("class", "occupation").text(this.occupation)
      )
      .append("div")
      .attr("class", "focus-value")
      .text("0%");
    if (this.isBenchmark) {
      this.focusHour = this.header
        .append("div")
        .append("div")
        .attr("class", "focus-hour")
        .text("12PM");
    }

    this.body = this.chart.append("div").attr("class", "chart-body");
    this.svg = this.body.append("svg");
    if (this.isBenchmark) {
      this.svg
        .on("pointermove", this.moved.bind(this))
        .on("pointerleave", this.left.bind(this));
    }

    this.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", `${this.id}-linearGradient`)
      .attr("gradientTransform", "rotate(90)")
      .selectAll("stop")
      .data([
        {
          offset: "10%",
          stopOpacity: 0.25,
        },
        {
          offset: "90%",
          stopOpacity: 0,
        },
      ])
      .join("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", "currentColor")
      .attr("stop-opacity", (d) => d.stopOpacity);

    if (this.isBenchmark) {
      this.gy = this.svg.append("g").attr("class", "axis y");
      this.gx = this.svg.append("g").attr("class", "axis x");
      this.focusRect = this.svg.append("rect").attr("class", "focus-rect");
    }
    this.areaPath = this.svg
      .append("path")
      .datum([...this.data, this.data[0]])
      .attr("class", "area-path")
      .attr("fill", `url(#${this.id}-linearGradient)`);
    this.linePath = this.svg
      .append("path")
      .datum([...this.data, this.data[0]])
      .attr("class", "line-path");

    new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.resize(entry.contentRect);
      });
    }).observe(this.svg.node());
  }

  resize({ width, height }) {
    this.width = width;
    this.height = height;

    this.x.range([this.marginLeft, this.width - this.marginRight]);

    this.xTick.range(this.x.range());

    this.y.range([this.height - this.marginBottom, this.marginTop]);

    this.render();
    this.focus(this.focusIndex);
  }

  render() {
    if (this.isBenchmark) {
      this.gy.attr("transform", `translate(${this.marginLeft},0)`).call(
        d3
          .axisLeft(this.y)
          .ticks(5)
          .tickFormat(this.formatY)
          .tickPadding(10)
          .tickSize(-(this.width - this.marginLeft - this.marginRight))
      );
      this.gy.select(".domain").remove();

      this.gx
        .attr("transform", `translate(0,${this.height - this.marginBottom})`)
        .call(
          d3
            .axisBottom(this.xTick)
            .tickFormat(
              this.formatXTick(this.width - this.marginLeft - this.marginRight)
            )
            .tickSizeInner(5)
            .tickSizeOuter(0)
            .tickPadding(10)
        );

      this.focusRect
        .attr("width", this.xTick.step())
        .attr("y", this.marginTop)
        .attr("height", this.height - this.marginBottom - this.marginTop);
    }

    this.areaPath.attr("d", this.area);

    this.linePath.attr("d", this.line);
  }

  moved(event) {
    const [px] = d3.pointer(event, this.svg.node());
    const i = Math.floor(this.x.invert(px));
    if (i !== this.focusIndex) {
      this.container.dispatch("focusindexchange", {
        detail: i,
        bubbles: true,
      });
    }
  }

  left() {
    this.container.dispatch("focusindexchange", {
      bubbles: true,
    });
  }

  focus(focusIndex) {
    this.focusIndex = focusIndex;

    if (this.isBenchmark) {
      this.focusHour.text(this.formatX(this.focusIndex));

      this.focusRect.attr("x", this.x(this.focusIndex));
    }

    this.focusValue.text(this.formatY(this.data[this.focusIndex]));
  }
}
