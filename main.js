const state = {
  dataset: null,
  selectedWord: null,
};

const wordPicker = document.querySelector('#word-picker');
const meaningEl = document.querySelector('#word-meaning');
const treeContainer = document.querySelector('#tree-container');
const timelineContainer = document.querySelector('#timeline-container');

async function init() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) {
      throw new Error(`Failed to load dataset: ${response.status}`);
    }

    state.dataset = await response.json();
    populateWordPicker(state.dataset.words);

    if (state.dataset.words.length > 0) {
      selectWord(state.dataset.words[0].word);
    }
  } catch (error) {
    treeContainer.innerHTML = `<p class="error">Could not load etymology data. ${error.message}</p>`;
    timelineContainer.innerHTML = '';
  }
}

function populateWordPicker(words) {
  wordPicker.innerHTML = words
    .map(({ word }) => `<option value="${word}">${capitalize(word)}</option>`)
    .join('');

  wordPicker.addEventListener('change', (event) => {
    selectWord(event.target.value);
  });
}

function selectWord(word) {
  const entry = state.dataset.words.find((item) => item.word === word);
  if (!entry) return;

  state.selectedWord = entry;
  meaningEl.textContent = entry.meaning;

  renderTree(entry.tree);
  renderTimeline(entry.timeline);
}

function renderTree(treeData) {
  treeContainer.innerHTML = '';

  const width = treeContainer.clientWidth || 800;
  const height = 420;
  const margin = { top: 20, right: 120, bottom: 20, left: 120 };

  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
  treeLayout(root);

  const svg = d3
    .select(treeContainer)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'viz-svg');

  const graph = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  graph
    .selectAll('path.link')
    .data(root.links())
    .join('path')
    .attr('class', 'tree-link')
    .attr(
      'd',
      d3
        .linkHorizontal()
        .x((d) => d.y)
        .y((d) => d.x)
    );

  const nodes = graph
    .selectAll('g.node')
    .data(root.descendants())
    .join('g')
    .attr('class', 'tree-node')
    .attr('transform', (d) => `translate(${d.y},${d.x})`);

  nodes
    .append('circle')
    .attr('r', 6)
    .on('mouseenter', function () {
      d3.select(this).transition().duration(120).attr('r', 9);
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('r', 6);
    });

  nodes
    .append('text')
    .attr('x', (d) => (d.children ? -10 : 10))
    .attr('dy', '0.32em')
    .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
    .text((d) => d.data.name);

  nodes.append('title').text((d) => `${d.data.name}\n${d.data.period ?? ''}`);
}

function renderTimeline(timelineData) {
  timelineContainer.innerHTML = '';

  const width = timelineContainer.clientWidth || 800;
  const height = 220;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };

  const sorted = [...timelineData].sort((a, b) => a.year - b.year);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(sorted, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const svg = d3
    .select(timelineContainer)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'viz-svg');

  svg
    .append('line')
    .attr('x1', margin.left)
    .attr('y1', height / 2)
    .attr('x2', width - margin.right)
    .attr('y2', height / 2)
    .attr('class', 'timeline-axis');

  const marks = svg
    .selectAll('g.mark')
    .data(sorted)
    .join('g')
    .attr('class', 'timeline-mark')
    .attr('transform', (d) => `translate(${x(d.year)},${height / 2})`);

  marks
    .append('circle')
    .attr('r', 7)
    .on('mouseenter', function () {
      d3.select(this).transition().duration(120).attr('r', 10);
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('r', 7);
    });

  marks
    .append('text')
    .attr('y', -14)
    .attr('text-anchor', 'middle')
    .attr('class', 'timeline-form')
    .text((d) => d.form);

  marks
    .append('text')
    .attr('y', 22)
    .attr('text-anchor', 'middle')
    .attr('class', 'timeline-year')
    .text((d) => `${formatYear(d.year)} • ${d.label}`);

  marks.append('title').text((d) => `${d.form} (${d.label}, ${formatYear(d.year)})`);

  const axis = d3.axisBottom(x).ticks(5).tickFormat((value) => formatYear(value));
  svg.append('g').attr('transform', `translate(0, ${height - margin.bottom + 4})`).call(axis);
}

function formatYear(year) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

init();
