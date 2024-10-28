import {CppTypeEnum} from "./Enums";

export const CppTypeStrings: string[] = [
  "FLOAT",
  "INT_8",
  "INT_16",
  "INT_32",
  "UINT_8",
  "UINT_16",
  "UINT_32",
  "STRING"
];

export const cppMap: Map<string, CppTypeEnum> = new Map([
  ["FLOAT", CppTypeEnum.FLOAT],
  ["INT_8", CppTypeEnum.INT_8],
  ["INT_16", CppTypeEnum.INT_16],
  ["INT_32", CppTypeEnum.INT_32],
  ["UINT_8", CppTypeEnum.UINT_8],
  ["UINT_16", CppTypeEnum.UINT_16],
  ["UINT_32", CppTypeEnum.UINT_32],
  ["STRING", CppTypeEnum.STRING],
  ]);

export interface ValueTuple{
  value: (number | string);
  type: string;
}

export const DMSGTypeStrings = ["GETTER", "SETTER", "DOER"];

