/**
 *  Basic tests for the JavaScript wrapper for the GS1 Syntax Engine compiled
 *  as a WASM by Emscripten.
 *
 *  Copyright (c) 2024 GS1 AISBL.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

"use strict";

import { GS1encoder } from "./gs1encoder.mjs";

var gs1encoder = new GS1encoder();

test('setDLuri', async () => {
  await gs1encoder.init();

  expect(() => { gs1encoder.dataStr = "https://id.example.org/test/01/12312312312319?99=TESTING123" }).not.toThrow();

  expect(gs1encoder.dataStr).toBe("https://id.example.org/test/01/12312312312319?99=TESTING123");
  expect(gs1encoder.getDLuri()).toBe("https://id.gs1.org/01/12312312312319?99=TESTING123");
  expect(gs1encoder.aiDataStr).toBe("(01)12312312312319(99)TESTING123");

  expect(() => { gs1encoder.includeDataTitlesInHRI = true }).not.toThrow();
  expect(gs1encoder.hri).toStrictEqual(["GTIN (01) 12312312312319", "INTERNAL (99) TESTING123"]);

  expect(() => { gs1encoder.sym = GS1encoder.symbology.DM }).not.toThrow();
  expect(gs1encoder.sym).toBe(GS1encoder.symbology.DM);
  expect(gs1encoder.scanData).toBe("]d1https://id.example.org/test/01/12312312312319?99=TESTING123");

  gs1encoder.free();
});

test('setAIdataStr', async () => {
  var gs1encoder = new GS1encoder();
  await gs1encoder.init();

  expect(() => { gs1encoder.aiDataStr = "(01)12312312312319(99)TESTING123" }).not.toThrow();

  expect(gs1encoder.dataStr).toBe("^011231231231231999TESTING123");
  expect(gs1encoder.getDLuri()).toBe("https://id.gs1.org/01/12312312312319?99=TESTING123");
  expect(gs1encoder.aiDataStr).toBe("(01)12312312312319(99)TESTING123");
  expect(gs1encoder.hri).toStrictEqual(["(01) 12312312312319", "(99) TESTING123"]);

  expect(() => { gs1encoder.sym = GS1encoder.symbology.QR }).not.toThrow();
  expect(gs1encoder.sym).toBe(GS1encoder.symbology.QR);
  expect(gs1encoder.scanData).toBe("]Q3011231231231231999TESTING123");

  gs1encoder.free();
});

test('requisites', async () => {
  var gs1encoder = new GS1encoder();
  await gs1encoder.init();

  expect(gs1encoder.getValidationEnabled(GS1encoder.validation.RequisiteAIs)).toBe(true);
  expect(() => { gs1encoder.dataStr = "^0212312312312319" }).toThrow(/not satisfied/);

  expect(() => { gs1encoder.setValidationEnabled(GS1encoder.validation.RequisiteAIs, false) }).not.toThrow();
  expect(gs1encoder.getValidationEnabled(GS1encoder.validation.RequisiteAIs)).toBe(false);
  expect(() => { gs1encoder.dataStr = "^0212312312312319" }).not.toThrow();

  expect(gs1encoder.dataStr).toBe("^0212312312312319");
  expect(() => { gs1encoder.getDLuri() }).toThrow(/without a primary key/);
  expect(gs1encoder.aiDataStr).toBe("(02)12312312312319");
  expect(gs1encoder.hri).toStrictEqual(["(02) 12312312312319"]);

  expect(() => { gs1encoder.sym = GS1encoder.symbology.DataBarExpanded }).not.toThrow();
  expect(gs1encoder.sym).toBe(GS1encoder.symbology.DataBarExpanded);
  expect(gs1encoder.scanData).toBe("]e00212312312312319");

  gs1encoder.free();
});
