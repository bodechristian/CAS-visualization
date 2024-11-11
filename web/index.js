/**
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/* global info, module, source, target, form */

import {
  makeCreateRangeSelectorMatcher,
  createTextQuoteSelectorMatcher,
  describeTextQuote,
  createTextPositionSelectorMatcher,
  describeTextPosition,
  highlightText,
} from '@apache-annotator/dom';
import { makeRefinable } from '@apache-annotator/selector';

let moduleState = {
  cleanupFunctions: [],
};

const createMatcher = makeRefinable((selector) => {
  const innerCreateMatcher = {
    TextQuoteSelector: createTextQuoteSelectorMatcher,
    TextPositionSelector: createTextPositionSelectorMatcher,
    RangeSelector: makeCreateRangeSelectorMatcher(createMatcher),
  }[selector.type];

  if (!innerCreateMatcher) {
    throw new Error(`Unsupported selector type: ${selector.type}`);
  }

  return innerCreateMatcher(selector);
});

async function anchor(selector, attributes) {
  const matchAll = createMatcher(selector);
  const ranges = [];

  // First collect all matches, and only then highlight them; to avoid
  // modifying the DOM while the matcher is running.
  for await (const range of matchAll(target)) {
    ranges.push(range);
  }
  // create string from features for tooltip
  let str1 = attributes["%TYPE"]
  console.log(str1);

  let firstAttribute = true
  for (let k of Object.keys(attributes)) {
    if (k == "%TYPE") { continue; }
    if (firstAttribute) {
      str1 = str1.concat("\n", k + ": " + attributes[k])
    } else {
      str1 = str1.concat(" | ", k + ": " + attributes[k])
    }
  }
  for (const range of ranges) {
    const removeHighlight = highlightText(range, "mark", { "title": str1 });
    moduleState.cleanupFunctions.push(removeHighlight);
  }

}

function offsetAdapted(num, text) {
  // the html tag <p> makes newlines to <br/>, which are then removed by apache-annotator's normalizing
  // this throws off the index from .cas to apache-annotator
  // Thus the .cas indexes are adapted
  // TODO: fix issue when num close to indices

  // create list of indexes of newline characters
  var indices = [];
  for (var i = 0; i < text.length; i++) {
    if (text[i] == "\n" || text[i] == "\r") { indices.push(i); }
  }

  // offset increases for every newline that occurs BEFORE the given index
  var offset = 0
  for (var i = 0; i < indices.length; i++) {
    if (indices[i] < num) { offset += 1 }
  }

  return num - offset
}

// load json
let data = require('./documents/temp.json')

// get json id
let sofa_id = data["%VIEWS"]["_InitialView"]["%SOFA"]
// get cas text
var documenttext = ""
for (let el of data["%FEATURE_STRUCTURES"]) {
  if (el["%ID"] == sofa_id) {
    documenttext = el["sofaString"]
    // target.innerText = documenttext
    let textNode = document.createTextNode(documenttext)
    target.appendChild(textNode)
  }
}
// highlight each token
let coreAttributes = ["%ID", "begin", "end", "@sofa"]
for (let el of data["%FEATURE_STRUCTURES"]) {
  let relevantAttributes = {}

  // collect feature attributes
  for (let attr of Object.keys(el)) {
    if (!coreAttributes.includes(attr)) {
      relevantAttributes[attr] = el[attr]
    }
  }

  if (el["%TYPE"].startsWith("webanno")) {
    await anchor({ "type": "TextPositionSelector", "start": el["begin"], "end": el["end"] }, relevantAttributes);
  }
}









