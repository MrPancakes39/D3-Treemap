document.addEventListener("DOMContentLoaded", async () => {
    // gets which data to load | Defaults to "videogames"
    whichData = new URLSearchParams(window.location.search).get("data");
    whichData = whichData != "kickstarter" && whichData != "movies" ? "videogames" : whichData;

    DATASETS = {
        kickstarter: {
            title: "Kickstarter Pledges",
            description: "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
            option: "Kickstarter Data Set",
            url: "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json",
        },
        movies: {
            title: "Movie Sales",
            description: "Top 100 Highest Grossing Movies Grouped By Genre",
            option: "Movies Data Set",
            url: "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json",
        },
        videogames: {
            title: "Video Game Sales",
            description: "Top 100 Most Sold Video Games Grouped by Platform",
            option: "Video Game Data Set",
            url: "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json",
        },
    };

    // get data
    data = await d3.json(DATASETS[whichData].url);

    // svg props
    width = window.innerWidth;
    height = window.innerHeight;

    // svg
    svg = d3.select("body").append("svg").attr("width", width).attr("height", height).attr("id", "chart");

    getBBox = (elt) => elt.node().getBoundingClientRect();

    // tooltip
    {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("opacity", 0);
    }
    // dataset switcher
    {
        switcher = svg.append("g").attr("class", "switcher");
        let x = 0; // for positioning
        ["videogames", "movies", "kickstarter"].forEach((ds, i, arr) => {
            let op = switcher
                .append("a")
                .attr("xlink:href", `?data=${ds}`)
                .append("text")
                .text(DATASETS[ds].option)
                .attr("fill", "blue")
                .attr("transform", `translate(${x},0)`);
            x += getBBox(op).width;

            // if (i === 0) op.attr("transform", `translate(2,0)`);
            if (i !== arr.length - 1) {
                let txt = switcher.append("text").text("|").attr("transform", `translate(${x},0)`);
                x += getBBox(txt).width + 2;
            }
        });
        // for positioning
        switcher.attr("transform", () => {
            const bbox = getBBox(switcher);
            let w = 0.5 * (width - bbox.width);
            let h = bbox.height + 5;
            return `translate(${w},${h})`;
        });
    }

    fontSize = 50;
    heading = svg.append("g").attr("class", "heading");

    // title
    {
        title = heading
            .append("text")
            .text(DATASETS[whichData].title)
            .attr("id", "title")
            .attr("x", 0.5 * width)
            .attr("y", 0)
            .attr("font-size", fontSize)
            .style("font-weight", "bold");
        // for positioning
        title.style("transform", () => {
            const bbox = getBBox(title);
            let w = -bbox.width / 2 + 15;
            let h = bbox.height + 25;
            return `translate(${w}px, ${h}px)`;
        });
    }
    // description
    {
        description = heading
            .append("text")
            .text(DATASETS[whichData].description)
            .attr("id", "description")
            .attr("x", 0.5 * width)
            .attr("y", 0)
            .attr("font-size", fontSize / 3);
        // for positioning
        description.style("transform", () => {
            const bbox = getBBox(description);
            let w = -bbox.width / 2;
            let h = getBBox(title).height + 25 + bbox.height + 10;
            return `translate(${w}px, ${h}px)`;
        });
    }

    all_colors = [...d3.schemeTableau10, ...d3.schemeSet3];
    all_names = data.children.map((d) => d.name);
    if (all_names.length > all_colors.length) {
        throw new Error("all_names is longer than available colors");
    }
    colorMap = new Map(all_names.map((name, i) => [name, all_colors[i]]));

    // treemap
    {
        // Give the data to this cluster layout:
        root = d3.hierarchy(data).sum((d) => d.value);

        // Then d3.treemap computes the position of each element of the hierarchy
        d3
            .treemap()
            .size([0.6 * width, 0.6 * height])
            .padding(2)(root);

        tree = svg.append("g").attr("class", "tree");

        // adds rects
        tree.selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr("class", "tile")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .style("fill", (d) => colorMap.get(d.data.category))
            .style("stroke", "black")
            .attr("data-name", (d) => d.data.name)
            .attr("data-category", (d) => d.data.category)
            .attr("data-value", (d) => d.data.value)
            .on("mouseover", () => tooltip.style("opacity", 1))
            .on("mouseleave", () => tooltip.style("opacity", 0))
            .on("mousemove", (d) => {
                const { name, category, value } = d.target.dataset;
                tooltip
                    .html(`Name: ${name}\n` + `Category: ${category}\n` + `Value: ${value}`)
                    .style("left", `${d.x + 10}px`)
                    .style("top", `${d.y + 10}px`)
                    .attr("data-value", value);
            });

        // for positioning
        tree.style("transform", () => {
            const bbox = getBBox(tree);
            let w = 0.5 * width - bbox.width / 2;
            let desc_h = parseInt(description.style("transform").split(",")[1]);
            let h = desc_h + 10;
            return `translate(${w}px, ${h}px)`;
        });
    }
    // legend
    {
        legend = svg.append("g").attr("id", "legend");

        let color_size = 20;
        let legend_groups = legend.selectAll("g").data(all_names).enter().append("g").attr("class", "legend-group");

        legend_groups
            .append("rect")
            .attr("class", "legend-item")
            .attr("width", color_size)
            .attr("height", color_size)
            .attr("fill", (d) => colorMap.get(d));

        legend_groups
            .append("text")
            .attr("x", color_size + 5)
            .attr("y", color_size - 5)
            .text((d) => d);

        max_name_size = d3.max(all_names, (d) => d.length) * 10;
        legend_groups.style("transform", (_, i) => {
            let min_w = d3.max([max_name_size + color_size, 100]);
            let w = min_w * (i % 3);
            let h = (color_size + 10) * Math.floor(i / 3);
            return `translate(${w}px, ${h}px)`;
        });

        // for positioning
        legend.style("transform", () => {
            const bbox = getBBox(legend);
            let desc_h = parseInt(description.style("transform").split(",")[1]);
            let tree_h = getBBox(tree).height;
            let w = 0.5 * width - bbox.width / 2;
            let h = desc_h + tree_h + 2 * color_size;
            return `translate(${w}px, ${h}px)`;
        });
    }
});
