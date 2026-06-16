/**
 * Decision Tree Classifier in pure TypeScript
 * Handles training, evaluation, split calculation, serialization, and predictive class mapping.
 */

export interface TreeNode {
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  isLeaf?: boolean;
  value?: number; // predicted class label
}

export class DecisionTreeClassifier {
  private root: TreeNode | null = null;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(maxDepth = 5, minSamplesSplit = 2) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  // Calculate Gini Impurity: 1 - sum(p_i^2)
  private calculateGini(classes: number[]): number {
    if (classes.length === 0) return 0;
    const counts: { [key: number]: number } = {};
    for (const c of classes) {
      counts[c] = (counts[c] || 0) + 1;
    }
    let sumOfSquares = 0;
    for (const key in counts) {
      const p = counts[key] / classes.length;
      sumOfSquares += p * p;
    }
    return 1 - sumOfSquares;
  }

  // Split X, y on a feature at a threshold
  private split(X: number[][], y: number[], featureIndex: number, threshold: number) {
    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < X.length; i++) {
      if (X[i][featureIndex] <= threshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return { leftX, leftY, rightX, rightY };
  }

  // Find the overall best split for dataset
  private findBestSplit(X: number[][], y: number[]) {
    let bestGini = 1.0;
    let bestFeature = -1;
    let bestThreshold = -1;
    let bestSplit = null;

    const numFeatures = X[0]?.length || 0;
    if (numFeatures === 0) return null;

    for (let feature = 0; feature < numFeatures; feature++) {
      // Get unique values as candidate thresholds
      const values = X.map(row => row[feature]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

      // Try thresholds in middle of points
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const s = this.split(X, y, feature, threshold);

        if (s.leftY.length === 0 || s.rightY.length === 0) continue;

        // Weighted Gini Impurity of split
        const leftGini = this.calculateGini(s.leftY);
        const rightGini = this.calculateGini(s.rightY);
        const weightedGini = (s.leftY.length / y.length) * leftGini + (s.rightY.length / y.length) * rightGini;

        if (weightedGini < bestGini) {
          bestGini = weightedGini;
          bestFeature = feature;
          bestThreshold = threshold;
          bestSplit = s;
        }
      }
    }

    if (bestFeature === -1) return null;

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      leftX: bestSplit.leftX,
      leftY: bestSplit.leftY,
      rightX: bestSplit.rightX,
      rightY: bestSplit.rightY,
    };
  }

  // Get most common class (mode) of leaf
  private mostCommonValue(y: number[]): number {
    const counts: { [key: number]: number } = {};
    let maxCount = -1;
    let modeValue = -1;
    for (const c of y) {
      counts[c] = (counts[c] || 0) + 1;
      if (counts[c] > maxCount) {
        maxCount = counts[c];
        modeValue = c;
      }
    }
    return modeValue;
  }

  // Build tree recursively
  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const numSamples = X.length;
    const numLabels = new Set(y).size;

    // Terminal criteria
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || numLabels === 1 || numSamples === 0) {
      return { isLeaf: true, value: this.mostCommonValue(y) };
    }

    const splitInfo = this.findBestSplit(X, y);
    if (!splitInfo) {
      return { isLeaf: true, value: this.mostCommonValue(y) };
    }

    const leftChild = this.buildTree(splitInfo.leftX, splitInfo.leftY, depth + 1);
    const rightChild = this.buildTree(splitInfo.rightX, splitInfo.rightY, depth + 1);

    return {
      featureIndex: splitInfo.featureIndex,
      threshold: splitInfo.threshold,
      left: leftChild,
      right: rightChild,
      isLeaf: false,
    };
  }

  // Fit the tree on dataset X (samples x features), y (labels)
  public fit(X: number[][], y: number[]) {
    this.root = this.buildTree(X, y, 0);
  }

  // Predict class label for a single sample
  private predictRow(node: TreeNode, x: number[]): number {
    if (node.isLeaf) {
      return node.value!;
    }
    if (x[node.featureIndex!] <= node.threshold!) {
      return this.predictRow(node.left!, x);
    } else {
      return this.predictRow(node.right!, x);
    }
  }

  public predictSingle(x: number[]): number {
    if (!this.root) {
      // Default fallback fallback
      return 1; // Average Performer
    }
    return this.predictRow(this.root, x);
  }

  public predict(X: number[][]): number[] {
    return X.map(row => this.predictSingle(row));
  }

  // Serialization to back up model files offline
  public serialize(): string {
    return JSON.stringify(this.root);
  }

  public deserialize(jsonStr: string) {
    this.root = JSON.parse(jsonStr) as TreeNode;
  }
}

/**
 * Generate synthetic dataset CSV with realistic profiles.
 * Features:
 * - attendance: percentage (50 to 100)
 * - quiz_score: score (40 to 100)
 * - assignment_score: score (40 to 100)
 * - study_time: hours/week (1 to 15)
 * - previous_score: score (40 to 100)
 * Target Class:
 * - 0: Needs Improvement
 * - 1: Average Performer
 * - 2: High Performer
 */
export function generateDatasetCSV(count = 500): string {
  const headers = "attendance,quiz_score,assignment_score,study_time,previous_score,performance_category\n";
  const rows: string[] = [];

  for (let i = 0; i < count; i++) {
    // Determine profile
    const rand = Math.random();
    let attendance = 0;
    let quiz = 0;
    let assignment = 0;
    let studyTime = 0;
    let previous = 0;
    let category = 0; // 0=Needs Improvement, 1=Average Performer, 2=High Performer

    if (rand < 0.3) {
      // Needs Improvement profile
      attendance = Math.floor(Math.random() * 25) + 50; // 50 - 75%
      quiz = Math.floor(Math.random() * 25) + 40; // 40 - 65
      assignment = Math.floor(Math.random() * 25) + 40; // 40 - 65
      studyTime = Math.floor(Math.random() * 4) + 1; // 1 - 5 hours
      previous = Math.floor(Math.random() * 25) + 40; // 40 - 65
      category = 0;
    } else if (rand < 0.7) {
      // Average Performer profile
      attendance = Math.floor(Math.random() * 20) + 75; // 75 - 95%
      quiz = Math.floor(Math.random() * 20) + 65; // 65 - 85
      assignment = Math.floor(Math.random() * 20) + 65; // 65 - 85
      studyTime = Math.floor(Math.random() * 5) + 4; // 4 - 9 hours
      previous = Math.floor(Math.random() * 20) + 65; // 65 - 85
      category = 1;
    } else {
      // High Performer profile
      attendance = Math.floor(Math.random() * 11) + 90; // 90 - 100%
      quiz = Math.floor(Math.random() * 16) + 85; // 85 - 100
      assignment = Math.floor(Math.random() * 16) + 85; // 85 - 100
      studyTime = Math.floor(Math.random() * 8) + 8; // 8 - 16 hours
      previous = Math.floor(Math.random() * 16) + 85; // 85 - 100
      category = 2;
    }

    // Add some noise to make ML split calculation realistic
    if (Math.random() < 0.08) {
      category = Math.floor(Math.random() * 3);
    }

    rows.push(`${attendance},${quiz},${assignment},${studyTime},${previous},${category}`);
  }

  return headers + rows.join("\n");
}

/**
 * Calculates model metrics
 */
export function calculateModelMetrics(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  clf: DecisionTreeClassifier
) {
  const y_pred = clf.predict(X_test);

  // Compute accuracy
  let correct = 0;
  for (let i = 0; i < y_test.length; i++) {
    if (y_test[i] === y_pred[i]) {
      correct++;
    }
  }
  const accuracy = correct / y_test.length;

  // confusion matrix (3x3 for classes 0, 1, 2)
  const confusionMatrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < y_test.length; i++) {
    const trueClass = y_test[i];
    const predClass = y_pred[i];
    if (trueClass >= 0 && trueClass <= 2 && predClass >= 0 && predClass <= 2) {
      confusionMatrix[trueClass][predClass]++;
    }
  }

  // Calculate Precision, Recall, F1 for each class
  const report: {
    [key: string]: {
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    };
  } = {};

  const classNames = ['Needs Improvement', 'Average Performer', 'High Performer'];

  for (let c = 0; c < 3; c++) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let support = 0;

    for (let i = 0; i < y_test.length; i++) {
      if (y_test[i] === c) {
        support++;
        if (y_pred[i] === c) {
          tp++;
        } else {
          fn++;
        }
      } else {
        if (y_pred[i] === c) {
          fp++;
        }
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    report[classNames[c]] = {
      precision,
      recall,
      f1Score,
      support,
    };
  }

  return {
    accuracy,
    confusionMatrix,
    report,
    trainSize: X_train.length,
    testSize: X_test.length,
  };
}
