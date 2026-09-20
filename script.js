// ==============================
// データの読み込み
// ==============================

// 現在の記録
let records = JSON.parse(localStorage.getItem("records")) || [];

// 記録一覧から削除した過去データ
let deletedRecords =
  JSON.parse(localStorage.getItem("deletedRecords")) || [];


// ==============================
// HTMLの要素を取得
// ==============================

const dateInput = document.getElementById("date");
const exerciseInput = document.getElementById("exercise");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");

const addRecordButton = document.getElementById("addRecordButton");
const exerciseSelect = document.getElementById("exerciseSelect");

const recordList = document.getElementById("recordList");
const deletedRecordList =
  document.getElementById("deletedRecordList");

const analysisResult =
  document.getElementById("analysisResult");


// ==============================
// データを保存する関数
// ==============================

function saveData() {
  localStorage.setItem("records", JSON.stringify(records));
  localStorage.setItem(
    "deletedRecords",
    JSON.stringify(deletedRecords)
  );
}


// ==============================
// 推定1RMを計算する関数
// Epley式
// ==============================

function calculateOneRepMax(weight, reps) {
  return weight * (1 + reps / 30);
}


// ==============================
// 平均値を計算する関数
// ==============================

function calculateAverage(recordsArray) {

  if (recordsArray.length === 0) {
    return 0;
  }

  const total = recordsArray.reduce(function(sum, record) {
    return sum + record.estimated1RM;
  }, 0);

  return total / recordsArray.length;
}


// ==============================
// 記録追加
// ==============================

addRecordButton.addEventListener("click", function() {

  const date = dateInput.value;
  const exercise = exerciseInput.value.trim();
  const weight = Number(weightInput.value);
  const reps = Number(repsInput.value);

  // 入力チェック
  if (!date || !exercise || weight <= 0 || reps <= 0) {
    alert("日付、種目、重量、回数を正しく入力してください。");
    return;
  }

  // 新しい記録
  const newRecord = {

    id: Date.now(),

    date: date,

    exercise: exercise,

    weight: weight,

    reps: reps,

    estimated1RM: calculateOneRepMax(weight, reps)
  };

  // 記録を追加
  records.push(newRecord);

  // 保存
  saveData();

  // 入力欄をリセット
  dateInput.value = "";
  exerciseInput.value = "";
  weightInput.value = "";
  repsInput.value = "";

  // 画面更新
  updateExerciseSelect();
  displayRecords();
  displayDeletedRecords();
  updateAnalysis();
});


// ==============================
// 種目選択欄を更新
// ==============================

function updateExerciseSelect() {

  // 現在の記録
  const activeExercises = records.map(function(record) {
    return record.exercise;
  });

  // 過去データも種目として利用する
  const deletedExercises = deletedRecords.map(function(record) {
    return record.exercise;
  });

  // 2つをまとめる
  const exerciseNames = [
    ...activeExercises,
    ...deletedExercises
  ];

  // 重複削除
  const uniqueExercises = [...new Set(exerciseNames)];

  exerciseSelect.innerHTML = `
    <option value="">種目を選択してください</option>
  `;

  uniqueExercises.forEach(function(exercise) {

    const option = document.createElement("option");

    option.value = exercise;
    option.textContent = exercise;

    exerciseSelect.appendChild(option);
  });
}


// ==============================
// 記録一覧を表示
// ==============================

function displayRecords() {

  if (records.length === 0) {

    recordList.innerHTML =
      "<p>まだ記録がありません。</p>";

    return;
  }

  // 新しい順
  const sortedRecords = [...records].sort(function(a, b) {

    return new Date(b.date) - new Date(a.date);

  });

  recordList.innerHTML = "";

  sortedRecords.forEach(function(record) {

    const recordItem =
      document.createElement("div");

    recordItem.className = "record-item";

    recordItem.innerHTML = `

      <strong>${record.date}</strong><br>

      種目：${record.exercise}<br>

      記録：${record.weight}kg × ${record.reps}回<br>

      推定1RM：
      ${record.estimated1RM.toFixed(1)}kg

      <br>

      <button
        class="delete-button"
        onclick="deleteRecord(${record.id})"
      >
        削除
      </button>

    `;

    recordList.appendChild(recordItem);
  });
}


// ==============================
// 記録を削除
// ==============================
//
// 「削除」と言っても完全削除ではない。
// recordsから削除して、
// deletedRecordsへ移動する。
// ==============================

function deleteRecord(id) {

  // 削除する記録を探す
  const recordToDelete = records.find(function(record) {

    return record.id === id;

  });

  if (!recordToDelete) {
    return;
  }

  // 現在の記録から削除
  records = records.filter(function(record) {

    return record.id !== id;

  });

  // 過去データへ移動
  deletedRecords.push(recordToDelete);

  // 保存
  saveData();

  // 画面更新
  updateExerciseSelect();
  displayRecords();
  displayDeletedRecords();
  updateAnalysis();
}


// ==============================
// 過去データを表示
// ==============================

function displayDeletedRecords() {

  if (deletedRecords.length === 0) {

    deletedRecordList.innerHTML =
      "<p>過去データはありません。</p>";

    return;
  }

  // 新しい順
  const sortedRecords =
    [...deletedRecords].sort(function(a, b) {

      return new Date(b.date) - new Date(a.date);

    });

  deletedRecordList.innerHTML = "";

  sortedRecords.forEach(function(record) {

    const recordItem =
      document.createElement("div");

    recordItem.className = "record-item";

    recordItem.innerHTML = `

      <strong>${record.date}</strong><br>

      種目：${record.exercise}<br>

      記録：
      ${record.weight}kg × ${record.reps}回<br>

      推定1RM：
      ${record.estimated1RM.toFixed(1)}kg

      <br>

      <button
        onclick="restoreRecord(${record.id})"
      >
        記録一覧に戻す
      </button>

      <button
        class="delete-button"
        onclick="permanentlyDeleteRecord(${record.id})"
      >
        完全削除
      </button>

    `;

    deletedRecordList.appendChild(recordItem);
  });
}


// ==============================
// 過去データを記録一覧へ戻す
// ==============================

function restoreRecord(id) {

  const recordToRestore =
    deletedRecords.find(function(record) {

      return record.id === id;

    });

  if (!recordToRestore) {
    return;
  }

  // 過去データから削除
  deletedRecords = deletedRecords.filter(function(record) {

    return record.id !== id;

  });

  // 現在の記録へ戻す
  records.push(recordToRestore);

  // 保存
  saveData();

  // 画面更新
  updateExerciseSelect();
  displayRecords();
  displayDeletedRecords();
  updateAnalysis();
}


// ==============================
// 過去データを完全削除
// ==============================

function permanentlyDeleteRecord(id) {

  const answer = confirm(
    "このデータを完全に削除しますか？\n\n完全削除すると、あとから復元できません。"
  );

  if (!answer) {
    return;
  }

  deletedRecords = deletedRecords.filter(function(record) {

    return record.id !== id;

  });

  saveData();

  updateExerciseSelect();
  displayDeletedRecords();
  updateAnalysis();
}


// ==============================
// 種目選択が変更されたとき
// ==============================

exerciseSelect.addEventListener("change", function() {

  updateAnalysis();

});


// ==============================
// 成長分析
// ==============================

function updateAnalysis() {

  const selectedExercise =
    exerciseSelect.value;

  if (!selectedExercise) {

    analysisResult.innerHTML = `
      <p>分析する種目を選択してください。</p>
    `;

    return;
  }


  // 現在の記録＋過去データ
  const allRecords = [
    ...records,
    ...deletedRecords
  ];


  // 選択した種目だけ抽出
  const exerciseRecords = allRecords

    .filter(function(record) {

      return record.exercise === selectedExercise;

    })

    .sort(function(a, b) {

      return new Date(a.date) - new Date(b.date);

    });


  if (exerciseRecords.length === 0) {

    analysisResult.innerHTML = `
      <p>この種目の記録がありません。</p>
    `;

    return;
  }


  // ==========================
  // 記録が1件
  // ==========================

  if (exerciseRecords.length === 1) {

    const record = exerciseRecords[0];

    analysisResult.innerHTML = `

      <h3>${selectedExercise}の成長分析</h3>

      <div class="analysis-method">
        現在は記録が1件のため、
        成長率は計算できません。
      </div>

      <div class="analysis-grid">

        <div class="analysis-item">

          <span class="analysis-label">
            現在の重量
          </span>

          <span class="analysis-value">
            ${record.weight}kg
          </span>

        </div>


        <div class="analysis-item">

          <span class="analysis-label">
            現在の回数
          </span>

          <span class="analysis-value">
            ${record.reps}回
          </span>

        </div>


        <div class="analysis-item">

          <span class="analysis-label">
            現在の推定1RM
          </span>

          <span class="analysis-value">
            ${record.estimated1RM.toFixed(1)}kg
          </span>

        </div>

      </div>

      <p class="note">
        ※比較対象となる別の日の記録が必要です。
      </p>

    `;

    return;
  }


  // ==========================
  // 比較方法
  // ==========================

  let firstAverage;

  let latestAverage;

  let comparisonText;

  let comparisonCount;


  // 2～5件
  if (exerciseRecords.length < 6) {

    const firstRecord =
      exerciseRecords[0];

    const latestRecord =
      exerciseRecords[exerciseRecords.length - 1];

    firstAverage =
      firstRecord.estimated1RM;

    latestAverage =
      latestRecord.estimated1RM;

    comparisonText =
      "初回の記録と最新の記録を比較しています。";

    comparisonCount = 1;

  }


  // 6件以上
  else {

    const firstRecords =
      exerciseRecords.slice(0, 3);

    const latestRecords =
      exerciseRecords.slice(-3);

    firstAverage =
      calculateAverage(firstRecords);

    latestAverage =
      calculateAverage(latestRecords);

    comparisonText =
      "最初の3回の平均と、直近の3回の平均を比較しています。";

    comparisonCount = 3;
  }


  // ==========================
  // 増加量・変化率
  // ==========================

  const increase =
    latestAverage - firstAverage;

  const increaseRate =
    (increase / firstAverage) * 100;


  // ==========================
  // 分析期間
  // ==========================

  const firstDate =
    new Date(exerciseRecords[0].date);

  const latestDate =
    new Date(
      exerciseRecords[exerciseRecords.length - 1].date
    );

  const differenceMilliseconds =
    latestDate - firstDate;

  const differenceDays =
    differenceMilliseconds /
    (1000 * 60 * 60 * 24);

  const differenceMonths =
    differenceDays / 30.44;


  // ==========================
  // 増加・減少のクラス
  // ==========================

  let rateClass = "";

  if (increaseRate > 0) {

    rateClass = "positive";

  } else if (increaseRate < 0) {

    rateClass = "negative";

  }


  // ==========================
  // 分析結果を表示
  // ==========================

  analysisResult.innerHTML = `

    <h3>${selectedExercise}の成長分析</h3>

    <div class="analysis-method">

      ${comparisonText}

      <br>

      比較に使用した記録数：
      最初${comparisonCount}件・直近${comparisonCount}件

    </div>


    <div class="analysis-grid">


      <div class="analysis-item">

        <span class="analysis-label">
          記録数
        </span>

        <span class="analysis-value">
          ${exerciseRecords.length}件
        </span>

      </div>


      <div class="analysis-item">

        <span class="analysis-label">
          分析期間
        </span>

        <span class="analysis-value">
          ${differenceMonths.toFixed(1)}か月
        </span>

      </div>


      <div class="analysis-item">

        <span class="analysis-label">
          最初側の平均推定1RM
        </span>

        <span class="analysis-value">
          ${firstAverage.toFixed(1)}kg
        </span>

      </div>


      <div class="analysis-item">

        <span class="analysis-label">
          直近側の平均推定1RM
        </span>

        <span class="analysis-value">
          ${latestAverage.toFixed(1)}kg
        </span>

      </div>


      <div class="analysis-item">

        <span class="analysis-label">
          推定1RMの増加量
        </span>

        <span class="analysis-value ${rateClass}">

          ${increase >= 0 ? "+" : ""}
          ${increase.toFixed(1)}kg

        </span>

      </div>


      <div class="analysis-item">

        <span class="analysis-label">
          推定1RMの変化率
        </span>

        <span class="analysis-value ${rateClass}">

          ${increaseRate >= 0 ? "+" : ""}
          ${increaseRate.toFixed(1)}%

        </span>

      </div>


    </div>


    <p class="note">

      ※推定1RMは、入力された重量と回数から
      算出した目安です。

      ${
        exerciseRecords.length < 6

        ? "記録が少ないため、今回の結果は参考値です。"

        : "複数回の平均を使い、1回だけの好不調の影響を抑えています。"
      }

    </p>

  `;
}


// ==============================
// ページを開いたときに実行
// ==============================

updateExerciseSelect();

displayRecords();

displayDeletedRecords();

updateAnalysis();