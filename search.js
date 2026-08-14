(function () {
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  if (!input || !results || !window.SEARCH_INDEX) return;

  var MAX_RESULTS = 6;
  var SNIPPET_LEN = 140;
  var selectedIndex = -1;
  var currentMatches = [];

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function snippet(text) {
    if (text.length <= SNIPPET_LEN) return text;
    return text.slice(0, SNIPPET_LEN).replace(/\s+\S*$/, '') + '…';
  }

  function scoreRecord(record, terms) {
    var heading = record.heading.toLowerCase();
    var text = record.text.toLowerCase();
    var keywords = record.keywords || [];
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (!term) continue;
      if (keywords.indexOf(term) !== -1) score += 20;
      score += countOccurrences(heading, term) * 3;
      score += countOccurrences(text, term) * 1;
    }
    return score;
  }

  function hrefFor(record) {
    return record.page + (record.anchor ? '#' + record.anchor : '');
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    var count = 0;
    var pos = 0;
    while ((pos = haystack.indexOf(needle, pos)) !== -1) {
      count++;
      pos += needle.length;
    }
    return count;
  }

  function search(query) {
    var terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var scored = window.SEARCH_INDEX.map(function (record) {
      return { record: record, score: scoreRecord(record, terms) };
    }).filter(function (entry) { return entry.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, MAX_RESULTS).map(function (entry) { return entry.record; });
  }

  function render(query) {
    if (!query.trim()) {
      results.hidden = true;
      results.innerHTML = '';
      selectedIndex = -1;
      currentMatches = [];
      return;
    }

    currentMatches = search(query);
    selectedIndex = -1;
    results.hidden = false;

    if (!currentMatches.length) {
      results.innerHTML = '<div class="search-empty">no matches for "' + escapeHtml(query) +
        '" — try "skills", "projects", "contact", or "about"</div>';
      return;
    }

    results.innerHTML = currentMatches.map(function (record, i) {
      return '<a class="search-result" href="' + hrefFor(record) + '" data-index="' + i + '">' +
        '<span class="sr-heading">' + escapeHtml(record.heading) + '</span>' +
        '<span class="sr-page">' + escapeHtml(record.page.replace('.html', '')) + '</span>' +
        '<span class="sr-snippet">' + escapeHtml(snippet(record.text)) + '</span>' +
        '</a>';
    }).join('');
  }

  function updateSelection() {
    var rows = results.querySelectorAll('.search-result');
    rows.forEach(function (row, i) {
      row.classList.toggle('selected', i === selectedIndex);
    });
    if (selectedIndex >= 0 && rows[selectedIndex]) {
      rows[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  input.addEventListener('input', function () {
    render(input.value);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      if (!currentMatches.length) return;
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentMatches.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      if (!currentMatches.length) return;
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === 'Enter') {
      if (!currentMatches.length) return;
      e.preventDefault();
      var target = currentMatches[selectedIndex >= 0 ? selectedIndex : 0];
      window.location.href = hrefFor(target);
    } else if (e.key === 'Escape') {
      input.value = '';
      render('');
    }
  });

  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) {
      results.hidden = true;
    } else if (input.value.trim()) {
      results.hidden = false;
    }
  });
})();
