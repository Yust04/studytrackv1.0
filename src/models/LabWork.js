// src/models/LabWork.js
const LEGACY_VALUES = {
  NOT_STARTED: ["�?�� �?�?�����?�ؐ��'�?", "��??��?��? ��??��??��?��?��?��?��??��?�?��?��?'?"],
  IN_PROGRESS: ["�? ���?�?�Ő�?�-", "��?? ��?��?��??��??��?�?��??��?-"],
  DONE: ["�'���?�?���?�?", "��??��?��?��??��??��?��?��??��??"],
  DEFENDED: ["�-���:��%��?�?", "��?��?��?��?��?:��?��?%��?��??��??"],
};

export const STATUS = {
  NOT_STARTED: "Не розпочато",
  IN_PROGRESS: "У процесі",
  DONE: "Виконано",
  DEFENDED: "Захищено",
};

export const STATUS_VARIANTS = Object.fromEntries(
  Object.entries(LEGACY_VALUES).map(([key, values]) => [key, Array.from(new Set([STATUS[key], ...values]))])
);

export const normalizeStatus = (value) => {
  if (!value) return value;
  for (const [key, variants] of Object.entries(STATUS_VARIANTS)) {
    if (variants.includes(value)) {
      return STATUS[key];
    }
  }
  return value;
};

export const matchesStatus = (value, ...targets) => targets.some((target) => normalizeStatus(value) === target);
export const isDoneStatus = (value) => matchesStatus(value, STATUS.DONE, STATUS.DEFENDED);
export const isDefendedStatus = (value) => matchesStatus(value, STATUS.DEFENDED);
export const isCompletedStatus = (value) => matchesStatus(value, STATUS.DONE, STATUS.DEFENDED);

export const newLab = ({ number, topic = "", maxScore }) => ({
  number,
  topic,
  maxScore: Number(maxScore),
  obtainedScore: null,
  status: STATUS.NOT_STARTED,
  createdAt: Date.now(),
});
