let questions = [];

let stats = {
    "correct": new Set(),
    "incorrect": new Set(),
    "notry": new Set(),
    "open": new Set()
}

let currentQuestionIdx = undefined;
let correctAnswer = undefined;
let hasAnswered = false;

function sel(str) {
    return document.querySelector(str);
}

function loadPicAndText(el, text, pic) {
    if (pic) {
        el.querySelector(".picture").classList.remove("hidden");
        el.querySelector(".picture").src = "fragen/svgs/" + pic + ".svg";
    } else {
        el.querySelector(".picture").classList.add("hidden");
    }

    el.querySelector(".text").innerHTML = "";

    MathJax.HTML.addElement(el.querySelector(".text"), "div", {class: "mathjax"},[text]);
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,".mathjax"]);

    
    //el.querySelector(".text").appendChild(MathJax.HTML.TextNode(text));
}

function updateStatsBar() {
    let total = stats.correct.size + stats.incorrect.size + stats.notry.size;
    
    sel("#bar-correct").style.width = 100 * stats.correct.size / total + "%";
    sel("#bar-incorrect").style.width = 100 * stats.incorrect.size / total + "%";
    sel("#bar-notry").style.width = 100 * stats.notry.size / total + "%";

    sel("#stats-info").innerText = `C: ${stats.correct.size} I: ${stats.incorrect.size} N: ${stats.notry.size}`;
}

function answer(choice) {
    if (hasAnswered) return;
    hasAnswered = true;
    stats.notry.delete(currentQuestionIdx);
    if (choice == correctAnswer) {
        stats.correct.add(currentQuestionIdx);
        stats.incorrect.delete(currentQuestionIdx);
        stats.open.delete(currentQuestionIdx);
    } else {
        stats.incorrect.add(currentQuestionIdx);
    }
    let btnCorrect = sel("#answer-" + correctAnswer);
    for (let a of ["a","b","c","d"]) {
        let btn = sel("#answer-" + a);
        if (btn == btnCorrect) {
            btn.classList.add("correct");
        } else {
            btn.classList.add("incorrect");
        }
        if (a == choice)
            btn.classList.add("selected");
    }
    saveStats();
    updateStatsBar();
}

function answered(ev) {
    let choice = ev.currentTarget.id
    answer(choice.replace("answer-", ""));
}

function loadQuestion(q) {
    let classMap = {
        1: "N",
        2: "E",
        3: "A",
    }

    sel("#question-number").innerText = q.number;
    sel("#question-class").innerText = classMap[q.class];
    loadPicAndText(sel("#question-body"), q.question, q.picture_question)
    
    let remaining = ["a","b","c","d"];

    for (let a of ["a","b","c","d"]) {
        sel("#answer-" + a).classList.remove("correct");
        sel("#answer-" + a).classList.remove("incorrect");
        sel("#answer-" + a).classList.remove("selected");
        let choice_idx = Math.floor(Math.random() * remaining.length);
        let choice = remaining.splice(choice_idx, 1);
        loadPicAndText(sel("#answer-" + a), q["answer_" + choice], q["picture_" + choice]);
        if (choice == "a")
            correctAnswer = a;
        sel("#answer-" + a).onclick = answered;
    }
}

function clearPicAndText(el) {
    el.querySelector(".picture").classList.remove("hidden");
    el.querySelector(".picture").src = "";
    el.querySelector(".text").innerHTML = "";
}

function clearQuestion() {
    sel("#question-number").innerText = "";
    sel("#question-class").innerText = ""
    clearPicAndText(sel("#question-body"));

    for (let a of ["a","b","c","d"]) {
        sel("#answer-" + a).classList.remove("correct");
        sel("#answer-" + a).classList.remove("incorrect");
        sel("#answer-" + a).classList.remove("selected");
        clearPicAndText(sel("#answer-" + a));
        sel("#answer-" + a).onclick = () => {};
    }
    hasAnswered = false;
}

function loadRandomQuestion() {
    clearQuestion();

    if (stats.open.size == 0) {
        stats.open = new Set(stats.incorrect);
    }

    if (stats.open.size == 0) {
        alert("All clear!");
        resetStats();
        loadRandomQuestion();
        updateStatsBar();
        return;
    }

    let i = Math.floor(Math.random() * stats.open.size);
    let qIdx = Array.from(stats.open)[i];
    let q = questions[qIdx];

    console.log(qIdx);
    currentQuestionIdx = qIdx;

    loadQuestion(q);
}

function resetStats() {
    localStorage.clear();
    stats.notry = new Set(questions.keys());
    stats.correct = new Set();
    stats.incorrect = new Set();
    stats.open = new Set(questions.keys());
    saveStats();
}

function saveStats() {
    localStorage.setItem("stats", JSON.stringify({
        "notry": Array.from(stats.notry),
        "correct": Array.from(stats.correct),
        "incorrect": Array.from(stats.incorrect),
        "open": Array.from(stats.open),
    }));
}

function loadStats() {
    if (!localStorage.getItem("stats")) return false;

    let obj = JSON.parse(localStorage.getItem("stats"));

    stats.notry = new Set(obj.notry);
    stats.correct = new Set(obj.correct);
    stats.incorrect = new Set(obj.incorrect);
    stats.open = new Set(obj.open);

    return true;
}

window.onload = async () => {
    let res = await fetch("fragen/fragenkatalog3b.json");
    let parts = await res.json();
    parts = parts.sections;

    function iterate(parts) {
        for (let part of parts) {
            if (part.sections) {
                iterate(part.sections);
            } else {
                questions = questions.concat(part.questions);
            }
        }
    }

    iterate(parts);

    let success = loadStats();


    if (!success) {
        resetStats();
    }

    loadRandomQuestion();


    sel("#next-btn").onclick = loadRandomQuestion;

    updateStatsBar();
}

document.onkeydown = (ev) => {
    switch (ev.key) {
        case "1": {
            answer("a");
            break;
        }
        case "2": {
            answer("b");
            break;
        }
        case "3": {
            answer("c");
            break;
        }
        case "4": {
            answer("d");
            break;
        }
        case "Enter": {
            loadRandomQuestion();
            break;
        }
        default:
            return;
    }
    ev.preventDefault();
}
