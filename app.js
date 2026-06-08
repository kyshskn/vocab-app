class App {

  constructor() {
  this.mode = "EN_TO_JP";
  this.state = "HOME";

  this.words = [];
  this.quizWords = [];
  this.retryWords = [];

  this.index = 0;
  this.correct = 0;
  this.current = null;
  this.currentCSV = "words1900.csv";
  this.total = 0;
  this.mode = "EN_TO_JP";

  this.initCSV();

  this.loadWords();

  }

  setMode(mode, event) {

  this.mode = mode;

  document.querySelectorAll("#modeSelect button")
    .forEach(btn => btn.classList.remove("active"));

  if (event && event.target) {
    event.target.classList.add("active");
  }

  this.render();
  }

  async loadWords() {

  try {

    console.log("CSV読み込み開始");

    const res = await fetch("words.csv");

    console.log("fetch OK:", res.ok);

    const text = await res.text();

    console.log("CSV内容:", text.slice(0, 50));

    this.words = text.split("\n")
      .filter(v => v.trim())
      .map(line => {
        const parts = line.split(",");

        if (!parts[0] || !parts[1]) return null;

        return {
          word: parts[0].trim(),
          meaning: parts[1].trim()
        };
      })
      .filter(v => v !== null);

    console.log("単語数:", this.words.length);

    //this.createBlocks();
    
    document.getElementById("startNo").min = 1;
    document.getElementById("endNo").min = 1;

    document.getElementById("startNo").max = this.words.length;
    document.getElementById("endNo").max = this.words.length;
    
    this.state = "HOME";
    this.render();

  } catch (e) {
    console.error("loadWordsエラー:", e);
  }

  this.mode = "EN_TO_JP";

  setTimeout(() => {
  document
    .querySelector("#modeSelect button")
    ?.classList.add("active");
  }, 0);
  }

  async initCSV() {

  await this.loadCSV("words1900.csv", {
    target: document.querySelector("#csvSelect button")
  });

  // 強制的にactive状態
  document.querySelectorAll("#csvSelect button")
    .forEach(btn => btn.classList.remove("active"));

  document.querySelector("#csvSelect button").classList.add("active");
  }

  async loadCSV(filename, event) {

  this.currentCSV = filename; // ★保存

  document.querySelectorAll("#csvSelect button")
    .forEach(btn => btn.classList.remove("active"));

  event.target.classList.add("active");

  const res = await fetch(filename);
  const text = await res.text();

  this.words = text.split("\n")
    .filter(v => v.trim())
    .map(line => {
      const parts = line.split(",");
      return {
        word: parts[0].trim(),
        meaning: parts[1].trim()
      };
    });

  document.getElementById("startNo").max = this.words.length;
  document.getElementById("endNo").max = this.words.length;

  this.state = "HOME";
  this.render();
  }

  createBlocks() {

    //const container = document.getElementById("blockSelect");
    container.innerHTML = "";

    const size = 10;
    const count = Math.ceil(this.words.length / size);

    for (let i = 0; i < count; i++) {

      const btn = document.createElement("button");
      btn.className = "blockBtn";

      const start = i * size + 1;
      const end = Math.min((i + 1) * size, this.words.length);

      btn.textContent = `${start}〜${end}`;

      btn.onclick = () => this.selectBlock(i);

      container.appendChild(btn);
    }
  }

  selectBlock(i) {

    const size = 10;
    const start = i * size;
    const end = start + size;

    this.quizWords = this.shuffle([...this.words.slice(start, end)]);

    console.log("quizWords:", this.quizWords);

    if (this.quizWords.length === 0) {
      alert("問題がありません");
      return;
    }

    this.retryWords = [];
    this.index = 0;
    this.correct = 0;
    this.total = this.quizWords.length;

    this.state = "QUIZ";
    this.render();

    this.next();
  }

  next() {

  if (!this.quizWords || this.quizWords.length === 0) return;

  if (this.index >= this.quizWords.length) {
    this.state = "RESULT";
    this.render();
    this.showResult();
    return;
  }

  this.current = this.quizWords[this.index];

  if (this.mode === "EN_TO_JP") {
    this.speak(this.current.word);
  }

  this.showChoices();

  this.render();
  this.index++;
  }

  showChoices() {

  const div = document.getElementById("choices");
  div.innerHTML = "";

  let correctAnswer =
    this.mode === "EN_TO_JP"
      ? this.current.meaning
      : this.current.word;

  let questionText =
    this.mode === "EN_TO_JP"
      ? this.current.word
      : this.current.meaning;

  // 表示入れ替え
  document.getElementById("word").textContent = questionText;

  let correct =
  this.mode === "EN_TO_JP"
    ? this.current.meaning
    : this.current.word;

  let options = [correct];

  while (options.length < 4) {

  const r = this.words[Math.floor(Math.random() * this.words.length)];

  let candidate =
    this.mode === "EN_TO_JP"
      ? r.meaning
      : r.word;

  if (!options.includes(candidate)) {
    options.push(candidate);
  }
  }

  while (options.length < 4) {

    const r = this.words[Math.floor(Math.random() * this.words.length)];

    let candidate =
      this.mode === "EN_TO_JP"
        ? r.meaning
        : r.word;

    if (!options.includes(candidate)) {
      options.push(candidate);
    }
  }

  options.sort(() => Math.random() - 0.5);

  options.forEach(o => {

    const btn = document.createElement("button");
    btn.textContent = o;

    btn.onclick = () => this.answer(o);

    div.appendChild(btn);
  });
  }

  answer(selected) {

  let correct =
    this.mode === "EN_TO_JP"
      ? this.current.meaning
      : this.current.word;

  let ok = selected === correct;

  const buttons = document.querySelectorAll("#choices button");

  buttons.forEach(btn => {
    btn.disabled = true;

    if (btn.textContent === correct) {
      btn.classList.add("correct");
    }

    if (btn.textContent === selected && !ok) {
      btn.classList.add("wrong");
    }
  });

  if (!ok) {
    this.retryWords.push(this.current);
  } else {
    this.correct++;
  }

    setTimeout(() => this.next(), 800);
  }

  showResult() {

  document.getElementById("summary").innerHTML =
    `<h2 style="margin-bottom:10px;">結果</h2>
     正解：${this.correct}<br>
     不正解：${this.retryWords.length}`;
  }

  startRetry() {

  console.log("retry clicked", this.retryWords);

  if (!this.retryWords || this.retryWords.length === 0) {
    alert("再挑戦なし");
    return;
  }

  this.quizWords = this.shuffle([...this.retryWords]);

  this.retryWords = [];
  this.index = 0;
  this.correct = 0;
  this.total = this.quizWords.length;

  this.state = "QUIZ";

  this.render();

  // ★重要：renderのあと少し遅らせる
  setTimeout(() => {
    this.next();
  }, 0);
  }

  shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
  }

  goHome() {

  this.state = "HOME";

  this.quizWords = [];
  this.retryWords = [];

  this.index = 0;
  this.correct = 0;
  this.current = null;

  // ★重要：画面も強制リセット
  document.getElementById("summary").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("word").textContent = "";

  document.getElementById("retryBtn").style.display = "none";
  document.getElementById("homeBtn").style.display = "none";

  // ★入力欄を必ず表示状態に戻す
  document.getElementById("inputArea").style.display = "block";

  this.render();
  }

  render() {

  const modeSelect = document.getElementById("modeSelect");
  const csvSelect = document.getElementById("csvSelect");
  const inputArea = document.getElementById("inputArea");

  const word = document.getElementById("word");
  const choices = document.getElementById("choices");
  const summary = document.getElementById("summary");

  const retry = document.getElementById("retryBtn");
  const home = document.getElementById("homeBtn");
  const questionCount = document.getElementById("questionCount");

  // =====================
  // まず全部リセット
  // =====================
  modeSelect.style.display = "none";
  csvSelect.style.display = "none";
  inputArea.style.display = "none";

  retry.style.display = "none";
  home.style.display = "none";

  summary.innerHTML = "";

  // =====================
  // HOME
  // =====================
  if (this.state === "HOME") {

    modeSelect.style.display = "flex";
    csvSelect.style.display = "flex";
    inputArea.style.display = "flex";

    word.textContent = "";
    choices.innerHTML = "";

    questionCount.textContent = "単語範囲を選択してください";
  }

  // =====================
  // QUIZ
  // =====================
  if (this.state === "QUIZ") {

    home.style.display = "block";

    questionCount.textContent =
      `${this.index + 1}/${this.quizWords.length}`;

    if (this.current) {
      word.textContent =
        this.mode === "EN_TO_JP"
          ? this.current.word
          : this.current.meaning;
    }
  }

  // =====================
  // RESULT
  // =====================
  if (this.state === "RESULT") {

    home.style.display = "block";

    if (this.retryWords.length > 0) {
      retry.style.display = "block";
    }

    word.textContent = "";
    choices.innerHTML = "";

    summary.innerHTML =
      `<h2>結果</h2>
       正解：${this.correct}<br>
       不正解：${this.retryWords.length}`;
  }
  }

  selectRange() {

  console.log("決定ボタン押された");

  const startEl = document.getElementById("startNo");
  const endEl = document.getElementById("endNo");

  const start = Number(startEl.value);
  const end = Number(endEl.value);

  console.log("入力:", start, end);

  if (
    !start ||
    !end ||
    start < 1 ||
    end > this.words.length ||
    start > end
  ) {
    alert(`1〜${this.words.length}で入力してください`);
    return;
  }

  this.quizWords = this.shuffle(
    this.words.slice(start - 1, end)
  );

  console.log("出題数:", this.quizWords.length);

  this.retryWords = [];
  this.index = 0;
  this.correct = 0;
  this.total = this.quizWords.length;

  this.state = "QUIZ";

  this.render();
  this.next();
  }

  speak(text) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    speechSynthesis.speak(u);
  }
  
}

const app = new App();
window.app = app;