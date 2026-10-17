/* Barbearia 001 · projeto fictício de portfólio.
   Nenhum dado sai desta página: não há backend, envio ou armazenamento. */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- cabeçalho ---------- */

  var header = document.querySelector("[data-header]");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- menu mobile ---------- */

  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  var toggleLabel = toggle.querySelector(".nav__toggle-label");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggleLabel.textContent = open ? "Fechar" : "Menu";
    document.body.classList.toggle("menu-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a, button")) setMenu(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---------- seção ativa na navegação ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  // observa todas as seções, para que a marcação some fora das que estão no menu
  var sections = document.querySelectorAll("main > section");

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (entry.target.id && link.getAttribute("href") === "#" + entry.target.id) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- enquadramento da cena de abertura ----------
     Em telas estreitas, recorta o quadro em volta da cadeira
     em vez de simplesmente centralizar a imagem. */

  var scene = document.querySelector("[data-scene]");
  var frame = scene && scene.parentElement;

  function frameScene() {
    if (!frame.clientWidth || !frame.clientHeight) return;
    var ratio = frame.clientWidth / frame.clientHeight;
    var w, h, x, y;
    if (ratio >= 2.39) {
      w = 1600; h = 1600 / ratio; x = 0; y = (670 - h) / 2;
    } else if (ratio >= 1.1) {
      h = 670; w = h * ratio;
      x = Math.min(Math.max(980 - w * 0.56, 0), 1600 - w);
      y = 0;
    } else {
      // retrato: cadeira na metade de cima, chão escuro embaixo para o texto
      w = Math.min(760, 640 * Math.max(ratio, 0.85));
      h = w / ratio;
      x = 980 - w / 2;
      y = 0;
    }
    scene.setAttribute("viewBox", [x, y, w, h].map(function (n) { return Math.round(n); }).join(" "));
  }

  if (scene) {
    frameScene();
    window.addEventListener("resize", frameScene, { passive: true });
  }

  /* ---------- fotogramas: entram a partir do preto ---------- */

  var stills = document.querySelectorAll("[data-still]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var stillObserver = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty("--delay", batch * 140 + "ms");
        entry.target.classList.add("is-visible");
        batch += 1;
        stillObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    stills.forEach(function (still) { stillObserver.observe(still); });
  } else {
    stills.forEach(function (still) { still.classList.add("is-visible"); });
  }

  /* ---------- reserva (simulação) ---------- */

  var SERVICES = [
    { id: "corte", name: "Corte clássico", minutes: 45, price: 80 },
    { id: "barba", name: "Barba com toalha quente", minutes: 35, price: 60 },
    { id: "completa", name: "Sessão completa", minutes: 75, price: 130 },
    { id: "contorno", name: "Contorno", minutes: 20, price: 35 },
    { id: "pigmentacao", name: "Pigmentação discreta", minutes: 30, price: 70 }
  ];
  var TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  var WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var WEEKDAYS_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  var dialog = document.querySelector("[data-booking]");
  var form = dialog.querySelector("[data-booking-form]");
  var servicesBox = dialog.querySelector("[data-services]");
  var daysBox = dialog.querySelector("[data-days]");
  var timesBox = dialog.querySelector("[data-times]");
  var summary = dialog.querySelector("[data-summary]");
  var errorBox = dialog.querySelector("[data-error]");
  var done = dialog.querySelector("[data-done]");
  var doneTitle = dialog.querySelector("[data-done-title]");
  var recap = dialog.querySelector("[data-recap]");
  var nameInput = dialog.querySelector("#booking-name");
  var opener = null;

  function pad(n) { return String(n).padStart(2, "0"); }
  function money(n) { return "R$ " + n; }

  // próximos seis dias de funcionamento demonstrativo (terça a sábado)
  function upcomingDays() {
    var days = [];
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    while (days.length < 6) {
      d.setDate(d.getDate() + 1);
      var wd = d.getDay();
      if (wd >= 2 && wd <= 6) {
        days.push({
          value: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
          weekday: WEEKDAYS[wd],
          weekdayLong: WEEKDAYS_LONG[wd],
          date: pad(d.getDate()) + "/" + pad(d.getMonth() + 1)
        });
      }
    }
    return days;
  }
  var DAYS = upcomingDays();

  function option(group, value, labelHtml, extra) {
    var id = "opt-" + group + "-" + value.replace(/[^a-z0-9]/gi, "");
    var wrap = document.createElement("div");
    wrap.className = "option";
    wrap.innerHTML =
      '<input type="radio" name="' + group + '" id="' + id + '" value="' + value + '"' +
      (extra && extra.disabled ? " disabled" : "") + ">" +
      '<label for="' + id + '">' + labelHtml + "</label>";
    return wrap;
  }

  SERVICES.forEach(function (s) {
    servicesBox.appendChild(option("servico", s.id,
      '<span class="option__name">' + s.name + "</span>" +
      '<span class="option__meta">' + s.minutes + " min, " + money(s.price) + "</span>"));
  });

  DAYS.forEach(function (day) {
    daysBox.appendChild(option("dia", day.value,
      '<span class="chip__weekday">' + day.weekday + "</span> " + day.date +
      '<span class="visually-hidden">, ' + day.weekdayLong + "</span>"));
  });

  // horários indisponíveis só para o calendário parecer vivo; tudo é inventado
  function isTaken(dayIndex, timeIndex) {
    return (dayIndex * 7 + timeIndex * 3) % 5 === 0;
  }

  function renderTimes() {
    var dayValue = form.elements.dia.value;
    var dayIndex = Math.max(0, DAYS.findIndex(function (d) { return d.value === dayValue; }));
    var current = form.elements.horario ? form.elements.horario.value : "";
    timesBox.innerHTML = "";
    TIMES.forEach(function (t, i) {
      var taken = dayValue && isTaken(dayIndex, i);
      timesBox.appendChild(option("horario", t,
        t + (taken ? '<span class="visually-hidden"> (indisponível)</span>' : ""),
        { disabled: !dayValue || taken }));
    });
    if (current) {
      var again = timesBox.querySelector('input[value="' + current + '"]:not(:disabled)');
      if (again) again.checked = true;
    }
  }

  function selection() {
    var service = SERVICES.find(function (s) { return s.id === form.elements.servico.value; });
    var day = DAYS.find(function (d) { return d.value === form.elements.dia.value; });
    var time = form.elements.horario ? form.elements.horario.value : "";
    return { service: service, day: day, time: time };
  }

  function updateSummary() {
    var sel = selection();
    if (!sel.service) {
      summary.textContent = "Escolha um serviço para começar.";
    } else if (!sel.day) {
      summary.textContent = sel.service.name + ". Agora escolha o dia.";
    } else if (!sel.time) {
      summary.textContent = sel.service.name + ", " + sel.day.weekday + " " + sel.day.date + ". Falta o horário.";
    } else {
      summary.textContent = sel.service.name + ", " + sel.day.weekday + " " + sel.day.date + " às " + sel.time + ".";
    }
  }

  form.addEventListener("change", function (event) {
    if (event.target.name === "dia") renderTimes();
    errorBox.textContent = "";
    updateSummary();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var sel = selection();
    var missing = !sel.service ? "um serviço" : !sel.day ? "um dia" : !sel.time ? "um horário" : "";
    if (missing) {
      errorBox.textContent = "Escolha " + missing + " para confirmar a reserva.";
      var target = !sel.service ? servicesBox : !sel.day ? daysBox : timesBox;
      var first = target.querySelector("input:not(:disabled)");
      if (first) first.focus();
      return;
    }

    var name = nameInput.value.trim();
    doneTitle.textContent = name ? "Reserva simulada, " + name + "." : "Reserva simulada.";
    recap.innerHTML = "";
    [
      ["Serviço", sel.service.name],
      ["Dia", sel.day.weekdayLong + ", " + sel.day.date],
      ["Horário", sel.time],
      ["Duração", sel.service.minutes + " min"],
      ["Valor", money(sel.service.price) + " (fictício)"]
    ].forEach(function (row) {
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = row[0];
      dd.textContent = row[1];
      recap.appendChild(dt);
      recap.appendChild(dd);
    });

    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  function resetBooking(serviceId) {
    form.reset();
    form.hidden = false;
    done.hidden = true;
    errorBox.textContent = "";
    if (serviceId) {
      var input = servicesBox.querySelector('input[value="' + serviceId + '"]');
      if (input) input.checked = true;
    }
    renderTimes();
    updateSummary();
  }

  function openBooking(serviceId, trigger) {
    opener = trigger || null;
    resetBooking(serviceId);
    dialog.showModal();
    document.body.style.overflow = "hidden";
    var focusTarget = serviceId
      ? daysBox.querySelector("input")
      : servicesBox.querySelector("input");
    if (focusTarget) focusTarget.focus();
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-book]");
    if (!trigger) return;
    openBooking(trigger.getAttribute("data-book") || "", trigger);
  });

  dialog.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) {
      dialog.close();
      return;
    }
    if (event.target.closest("[data-restart]")) {
      resetBooking("");
      var first = servicesBox.querySelector("input");
      if (first) first.focus();
      return;
    }
    // clique fora do painel fecha
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", function () {
    document.body.style.overflow = "";
    if (opener && document.contains(opener) && opener.offsetParent !== null) {
      opener.focus();
    }
  });

  renderTimes();
  updateSummary();
})();
