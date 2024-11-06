function loadJSON(path, callback) {
  var req = new XMLHttpRequest();
  req.overrideMimeType("application/json");
  req.open('GET', path, true);
  req.onreadystatechange = function () {
    if (req.readyState == 4 && req.status == "200") {
      callback(JSON.parse(req.responseText));
    }
  };
  req.send(null);
}

function close_all(event){
  var details = document.querySelectorAll("details");
  details.forEach(function(details_elem){
    if (details_elem.hasAttribute("open")) {
      details_elem.removeAttribute("open");
    }
  });
}

function on_render() {
  var hits = document.querySelectorAll(".ais-Hits-item");
  hits.forEach(function(hit) {
    color = hit.querySelector("img").getAttribute("data-maincolor");
    hit.setAttribute("style", "background: rgba(" + color + ", 0.5)");
  })

  if ("ontouchstart" in window) {
    function close_all_panels(facets) {
      facets.querySelectorAll(".facet .ais-Panel-body").forEach(function(panel_body) {
        panel_body.style.display = "none";
      });
    }
    function toggle_panel(facet) {
      var panel_body = facet.querySelector(".ais-Panel-body");
      var style = window.getComputedStyle(panel_body);
      if (style.display == "none") {
        close_all_panels(facet.parentElement);
        panel_body.style.display = "inline-block";
      }
      else {
        panel_body.style.display = "none";
      }
    }

    var facets = document.querySelectorAll(".facet");
    facets.forEach(function(facet) {
      var is_loaded = facet.getAttribute("loaded");
      if (!is_loaded) {
        facet.addEventListener("click", function(event) {
          toggle_panel(facet);
          event.stopPropagation();
        });
        facet.setAttribute("loaded", true);
      }
    });
  }

  var summaries = document.querySelectorAll("summary");
  summaries.forEach(function(elem){
    function conditional_close(){
      close_all();
      if (!elem.parentElement.hasAttribute("open")) {
        var game_details = elem.parentElement.querySelector(".game-details");
        game_details.focus();
      }
    }
    elem.addEventListener("click", conditional_close);
    elem.addEventListener("keypress", conditional_close);
  });
  document.addEventListener("click", close_all);

  var game_details = document.querySelectorAll(".game-details");
  game_details.forEach(function(elem){
    var close = document.createElement("div");
    close.setAttribute("class", "close");
    close.setAttribute("tabindex", "0");
    close.innerHTML = "×";
    function close_details(event) {
      elem.parentElement.removeAttribute("open");
    }
    close.addEventListener("click", close_details);
    close.addEventListener("keypress", close_details);
    elem.appendChild(close);

    elem.addEventListener("click", function(event){
      event.stopPropagation();
    });
  });
}

function get_widgets(SETTINGS) {
  const WEIGHT_LABELS = [
    "Leicht",
    "Leicht-Mittel",
    "Mittel",
    "Mittel-Schwer",
    "Schwer"
  ];
  const PLAYING_TIME_ORDER = [
    '< 30 Min.',
    '30 Min. - 1 Std.',
    '1-2 Std.',
    '2-3 Std.',
    '3-4 Std.',
    '> 4 Std.'
  ];

  function panel(header) {
    return instantsearch.widgets.panel(
      {
        templates: {
          header: "<h3>" + header + "</h3>"
        }
      }
    )
  }

  return {
    "search": instantsearch.widgets.searchBox({
      container: '#search-box',
      placeholder: 'Spiele suchen'
    }),
    "sort": instantsearch.widgets.sortBy({
      container: '#sort-by',
      items: [
        {label: 'Name', value: SETTINGS.algolia.index_name},
        {label: 'BGG Rang', value: SETTINGS.algolia.index_name + '_rank_ascending'},
        {label: 'Anzahl Bewertungen', value: SETTINGS.algolia.index_name + '_numrated_descending'},
        {label: 'Anzahl Besitzer', value: SETTINGS.algolia.index_name + '_numowned_descending'}
      ]
    }),
    "clear": instantsearch.widgets.clearRefinements({
      container: '#clear-all',
      templates: {
        resetLabel: 'Alles zurücksetzen'
      }
    }),
    "refine_categories": panel('Kategorien')(instantsearch.widgets.refinementList)(
      {
        container: '#facet-categories',
        collapsible: true,
        attribute: 'categories',
        operator: 'and',
        showMore: true,
      }
    ),
    "refine_mechanics": panel('Mechaniken')(instantsearch.widgets.refinementList)(
      {
        container: '#facet-mechanics',
        collapsible: true,
        attribute: 'mechanics',
        operator: 'and',
        showMore: true,
      }
    ),
    "refine_players": panel('Anzahl Spieler')(instantsearch.widgets.hierarchicalMenu)(
      {
        container: '#facet-players',
        collapsible: true,
        attributes: ['players.level1', 'players.level2'],
        operator: 'or',
        sortBy: function(a, b){ return parseInt(a.name) - parseInt(b.name); },
      }
    ),
    "refine_weight": panel('Komplexität')(instantsearch.widgets.refinementList)(
      {
        container: '#facet-weight',
        attribute: 'weight',
        operator: 'or',
        sortBy: function(a, b){ return WEIGHT_LABELS.indexOf(a.name) - WEIGHT_LABELS.indexOf(b.name); },
      }
    ),
    "refine_playingtime": panel('Spielzeit')(instantsearch.widgets.refinementList)(
      {
        container: '#facet-playing-time',
        attribute: 'playing_time',
        operator: 'or',
        sortBy: function(a, b){ return PLAYING_TIME_ORDER.indexOf(a.name) - PLAYING_TIME_ORDER.indexOf(b.name); },
      }
    ),
    "refine_min_age": panel('Mindestalter')(instantsearch.widgets.numericMenu)(
      {
        container: '#facet-min-age',
        attribute: 'min_age',
        items: [
          { label: 'Jedes Alter' },
          { label: '< 5 Jahre', end: 4 },
          { label: '< 7 Jahre', end: 6 },
          { label: '< 9 Jahre', end: 8 },
          { label: '< 11 Jahre', end: 10 },
          { label: '< 13 Jahre', end: 12 },
          { label: '< 15 Jahre', end: 14 },
          { label: '15+', start: 15 },
        ]
      }
    ),
    "refine_previousplayers": panel('Frühere Spieler')(instantsearch.widgets.refinementList)(
      {
        container: '#facet-previous-players',
        attribute: 'previous_players',
        operator: 'and',
        searchable: true,
        showMore: true,
      }
    ),
    "refine_numplays": panel('Gesamtspielanzahl')(instantsearch.widgets.numericMenu)(
      {
        container: '#facet-numplays',
        attribute: 'numplays',
        items: [
          { label: 'Jede Spielanzahl' },
          { label: 'Keine Spiele', end: 0 },
          { label: '1 Spiel', start: 1, end: 1 },
          { label: '2-9 Spiele', start: 2, end: 9 },
          { label: '10-19 Spiele', start: 10, end: 19 },
          { label: '20-29 Spiele', start: 20, end: 29 },
          { label: '30+ Spiele', start: 30 },
        ]
      }
    ),
    "hits": instantsearch.widgets.hits({
      container: '#hits',
      transformItems: function(items) {
        hide_facet_when_no_data('#facet-previous-players', items, 'previous_players');
        hide_facet_when_no_data('#facet-numplays', items, 'numplays');

        return items.map(function(game){
          players = [];
          game.players.forEach(function(num_players){
            match = num_players.level2.match(/^\d+\ >\ ([\w\ ]+)\ (?:with|allows)\ (\d+\+?)$/);
            type = match[1].toLowerCase();
            num = match[2];

            type_callback = {
              'best': function(num) { return '<strong>' + num + '</strong><span title="Am besten mit">★</span>'; },
              'recommended': function(num) { return num; },
              'expansion': function(num) { return num + '<span title="Mit Erweiterung">⊕</span>'; },
            };
            players.push(type_callback[type](num));

            if (num.indexOf("+") > -1) {
              return;
            }
          });
          game.players_str = players.join(", ");
          game.categories_str = game.categories.join(", ");
          game.mechanics_str = game.mechanics.join(", ");
          game.tags_str = game.tags.join(", ");
          game.description = game.description.trim();
          game.has_expansions = (game.expansions.length > 0);
          game.has_more_expansions = (game.has_more_expansions);
          game.location = game.location;

          if (game.has_more_expansions) {
            game_prefix = game.name.indexOf(":")? game.name.substring(0, game.name.indexOf(":")) : game.name;
            game.name = game_prefix + " (und mehr)";
          }
          return game;
        });
      },
      templates: {
        item: document.getElementById('hit-template').innerHTML,
        empty: "Keine Spiele gefunden, die deinen Kriterien entsprechen."
      }
    }),
    "stats": instantsearch.widgets.stats({
      container: '#stats'
    }),
    "pagination": instantsearch.widgets.pagination({
      container: '#pagination'
    }),
  }
}
