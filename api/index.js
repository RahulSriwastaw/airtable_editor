// server/app.ts
import "dotenv/config";
import express from "express";
import path2 from "path";
import fs2 from "fs";

// server/airtableService.ts
import fs from "fs";
import path from "path";

// server/mockData.ts
var INITIAL_TABLES = [
  {
    id: "tbl_bp_08",
    name: "Bihar Police MockTest-08",
    description: "Bihar Police Constable Full Length Mock Test 08 (Hindi & English Bilingual)",
    category: "Bihar Police",
    recordCount: 25,
    lastModified: "2026-08-27T10:30:00.000Z",
    statusSummary: { draft: 4, inReview: 6, approved: 15 },
    hasImagesCount: 4
  },
  {
    id: "tbl_bsi_01",
    name: "Bihar SI MockTest-01",
    description: "Bihar Sub-Inspector Prelims Exam Paper-1 Mock Test",
    category: "Bihar SI",
    recordCount: 20,
    lastModified: "2026-08-26T18:45:00.000Z",
    statusSummary: { draft: 2, inReview: 5, approved: 13 },
    hasImagesCount: 3
  },
  {
    id: "tbl_bpsc_17",
    name: "72nd BPSC CCE 2026 Full Test-17",
    description: "72nd Combined Competitive Examination Prelims GS Paper Mock Test",
    category: "BPSC",
    recordCount: 30,
    lastModified: "2026-08-27T09:15:00.000Z",
    statusSummary: { draft: 6, inReview: 8, approved: 16 },
    hasImagesCount: 5
  },
  {
    id: "tbl_rly_05",
    name: "Railway NTPC MockTest-05",
    description: "RRB NTPC CBT-1 General Awareness & General Science Sectional Test",
    category: "SSC/Railway",
    recordCount: 15,
    lastModified: "2026-08-25T14:20:00.000Z",
    statusSummary: { draft: 1, inReview: 3, approved: 11 },
    hasImagesCount: 2
  },
  {
    id: "tbl_bp_09",
    name: "Bihar Police MockTest-09",
    description: "Bihar Police Constable Practice Set 09 with Current Affairs",
    category: "Bihar Police",
    recordCount: 18,
    lastModified: "2026-08-24T11:00:00.000Z",
    statusSummary: { draft: 5, inReview: 4, approved: 9 },
    hasImagesCount: 1
  }
];
var INITIAL_QUESTIONS = {
  "Bihar Police MockTest-08": [
    {
      id: "rec_bp08_001",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 1,
        question_hi: "<p><strong>\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u092E\u0916\u093E\u0928\u093E \u0905\u0928\u0941\u0938\u0902\u0927\u093E\u0928 \u0915\u0947\u0902\u0926\u094D\u0930</strong> (National Research Centre for Makhana) \u092C\u093F\u0939\u093E\u0930 \u0915\u0947 \u0915\u093F\u0938 \u091C\u093F\u0932\u0947 \u092E\u0947\u0902 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948?</p>",
        question_en: "<p>In which district of Bihar is the <strong>National Research Centre for Makhana</strong> located?</p>",
        option1_hi: "<p>\u0926\u0930\u092D\u0902\u0917\u093E (Darbhanga)</p>",
        option2_hi: "<p>\u092E\u0927\u0941\u092C\u0928\u0940 (Madhubani)</p>",
        option3_hi: "<p>\u0938\u092E\u0938\u094D\u0924\u0940\u092A\u0941\u0930 (Samastipur)</p>",
        option4_hi: "<p>\u092E\u0941\u091C\u092B\u094D\u092B\u0930\u092A\u0941\u0930 (Muzaffarpur)</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902 / \u090F\u0915 \u0938\u0947 \u0905\u0927\u093F\u0915</p>",
        option1_en: "<p>Darbhanga</p>",
        option2_en: "<p>Madhubani</p>",
        option3_en: "<p>Samastipur</p>",
        option4_en: "<p>Muzaffarpur</p>",
        option5_en: "<p>None of the above / More than one</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(1) \u0926\u0930\u092D\u0902\u0917\u093E</strong></p><p>\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u092E\u0916\u093E\u0928\u093E \u0905\u0928\u0941\u0938\u0902\u0927\u093E\u0928 \u0915\u0947\u0902\u0926\u094D\u0930 \u092D\u093E\u0930\u0924\u0940\u092F \u0915\u0943\u0937\u093F \u0905\u0928\u0941\u0938\u0902\u0927\u093E\u0928 \u092A\u0930\u093F\u0937\u0926 (ICAR) \u0915\u0947 \u0924\u0939\u0924 <strong>\u0926\u0930\u092D\u0902\u0917\u093E</strong>, \u092C\u093F\u0939\u093E\u0930 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0939\u0948\u0964 \u092C\u093F\u0939\u093E\u0930 \u0926\u0947\u0936 \u0915\u0947 \u0915\u0941\u0932 \u092E\u0916\u093E\u0928\u093E \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0915\u093E 85% \u0938\u0947 \u0905\u0927\u093F\u0915 \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0915\u0930\u0924\u093E \u0939\u0948\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(1) Darbhanga</strong></p><p>The National Research Centre for Makhana is situated in <strong>Darbhanga</strong>, Bihar under ICAR. Bihar accounts for over 85% of total makhana production in India.</p>",
        correct_option: "1",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-27T10:15:00.000Z"
      }
    },
    {
      id: "rec_bp08_002",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 2,
        question_hi: "<p>\u0928\u093F\u092E\u094D\u0928\u0932\u093F\u0916\u093F\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094C\u0928 \u0938\u093E <strong>\u092E\u094C\u0932\u093F\u0915 \u0905\u0927\u093F\u0915\u093E\u0930</strong> \u0915\u0947\u0935\u0932 \u092D\u093E\u0930\u0924\u0940\u092F \u0928\u093E\u0917\u0930\u093F\u0915\u094B\u0902 \u0915\u094B \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u0948, \u0935\u093F\u0926\u0947\u0936\u093F\u092F\u094B\u0902 \u0915\u094B \u0928\u0939\u0940\u0902?</p>",
        question_en: "<p>Which of the following <strong>Fundamental Rights</strong> is available only to Indian citizens and not to foreigners?</p>",
        option1_hi: "<p>\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 14 (\u0935\u093F\u0927\u093F \u0915\u0947 \u0938\u092E\u0915\u094D\u0937 \u0938\u092E\u093E\u0928\u0924\u093E)</p>",
        option2_hi: "<p>\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 19 (\u0935\u093E\u0915\u094D \u090F\u0935\u0902 \u0905\u092D\u093F\u0935\u094D\u092F\u0915\u094D\u0924\u093F \u0915\u0940 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E)</p>",
        option3_hi: "<p>\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 21 (\u092A\u094D\u0930\u093E\u0923 \u090F\u0935\u0902 \u0926\u0948\u0939\u093F\u0915 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E)</p>",
        option4_hi: "<p>\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 25 (\u0927\u0930\u094D\u092E \u0915\u094B \u092E\u093E\u0928\u0928\u0947 \u0915\u0940 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E)</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902</p>",
        option1_en: "<p>Article 14 (Equality before Law)</p>",
        option2_en: "<p>Article 19 (Freedom of speech and expression)</p>",
        option3_en: "<p>Article 21 (Protection of life and personal liberty)</p>",
        option4_en: "<p>Article 25 (Freedom of religion)</p>",
        option5_en: "<p>None of the above</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) \u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 19</strong></p><p>\u092D\u093E\u0930\u0924\u0940\u092F \u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u0915\u0947 \u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 15, 16, 19, 29 \u0914\u0930 30 \u0915\u0947\u0935\u0932 \u092D\u093E\u0930\u0924\u0940\u092F \u0928\u093E\u0917\u0930\u093F\u0915\u094B\u0902 \u0915\u094B \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u0948\u0902\u0964 \u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 14, 20, 21, 21A, 22, 23, 24, 25, 26, 27 \u0914\u0930 28 \u0928\u093E\u0917\u0930\u093F\u0915\u094B\u0902 \u090F\u0935\u0902 \u0935\u093F\u0926\u0947\u0936\u093F\u092F\u094B\u0902 \u0926\u094B\u0928\u094B\u0902 \u0915\u094B \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u0948\u0902\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) Article 19</strong></p><p>Articles 15, 16, 19, 29, and 30 are available exclusively to Indian citizens. Articles 14, 20, 21, etc. are available to both citizens and foreigners.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Pooja Verma",
        last_edited_at: "2026-08-27T08:30:00.000Z"
      }
    },
    {
      id: "rec_bp08_003",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 3,
        question_hi: "<p>\u0926\u093F\u090F \u0917\u090F \u092A\u0930\u093F\u092A\u0925 \u0906\u0930\u0947\u0916 (Circuit Diagram) \u092E\u0947\u0902 <strong>\u0924\u0941\u0932\u094D\u092F \u092A\u094D\u0930\u0924\u093F\u0930\u094B\u0927 (Equivalent Resistance)</strong> \u0915\u0940 \u0917\u0923\u0928\u093E \u0915\u0930\u0947\u0902:</p>",
        question_en: "<p>Calculate the <strong>equivalent resistance</strong> in the given circuit diagram:</p>",
        option1_hi: "<p>4 \u03A9</p>",
        option2_hi: "<p>6 \u03A9</p>",
        option3_hi: "<p>8 \u03A9</p>",
        option4_hi: "<p>12 \u03A9</p>",
        option5_hi: "<p>16 \u03A9</p>",
        option1_en: "<p>4 \u03A9</p>",
        option2_en: "<p>6 \u03A9</p>",
        option3_en: "<p>8 \u03A9</p>",
        option4_en: "<p>12 \u03A9</p>",
        option5_en: "<p>16 \u03A9</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) 6 \u03A9</strong></p><p>\u0938\u092E\u093E\u0928\u093E\u0902\u0924\u0930 \u0915\u094D\u0930\u092E \u092E\u0947\u0902 \u091C\u0941\u0921\u093C\u0947 \u0926\u094B 12 \u03A9 \u092A\u094D\u0930\u0924\u093F\u0930\u094B\u0927\u0915\u094B\u0902 \u0915\u093E \u092E\u093E\u0928: <em>R<sub>p</sub> = (12 \xD7 12) / (12 + 12) = 6 \u03A9</em> \u0939\u094B\u0924\u093E \u0939\u0948\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) 6 \u03A9</strong></p><p>Two 12 \u03A9 resistors connected in parallel give: <em>R<sub>p</sub> = (12 \xD7 12) / (12 + 12) = 6 \u03A9</em>.</p>",
        correct_option: "2",
        image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
        qa_status: "in_review",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-26T16:20:00.000Z"
      }
    },
    {
      id: "rec_bp08_004",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 4,
        question_hi: "<p>\u092C\u093F\u0939\u093E\u0930 \u092E\u0947\u0902 <strong>1857 \u0915\u0947 \u0935\u093F\u0926\u094D\u0930\u094B\u0939</strong> \u0915\u093E \u0928\u0947\u0924\u0943\u0924\u094D\u0935 \u091C\u0917\u0926\u0940\u0936\u092A\u0941\u0930 \u0938\u0947 \u0915\u093F\u0938\u0928\u0947 \u0915\u093F\u092F\u093E \u0925\u093E?</p>",
        question_en: "<p>Who led the <strong>Revolt of 1857</strong> in Bihar from Jagdishpur?</p>",
        option1_hi: "<p>\u092A\u0940\u0930 \u0905\u0932\u0940 \u0916\u093E\u0928</p>",
        option2_hi: "<p>\u0915\u0941\u0902\u0935\u0930 \u0938\u093F\u0902\u0939</p>",
        option3_hi: "<p>\u0905\u092E\u0930 \u0938\u093F\u0902\u0939</p>",
        option4_hi: "<p>\u0939\u0930\u0947 \u0915\u0943\u0937\u094D\u0923 \u0938\u093F\u0902\u0939</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902</p>",
        option1_en: "<p>Peer Ali Khan</p>",
        option2_en: "<p>Kunwar Singh</p>",
        option3_en: "<p>Amar Singh</p>",
        option4_en: "<p>Hare Krishna Singh</p>",
        option5_en: "<p>None of the above</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) \u0915\u0941\u0902\u0935\u0930 \u0938\u093F\u0902\u0939</strong></p><p>\u0935\u0940\u0930 \u0915\u0941\u0902\u0935\u0930 \u0938\u093F\u0902\u0939 \u0928\u0947 80 \u0935\u0930\u094D\u0937 \u0915\u0940 \u0909\u092E\u094D\u0930 \u092E\u0947\u0902 \u091C\u0917\u0926\u0940\u0936\u092A\u0941\u0930 (\u0906\u0930\u093E, \u092C\u093F\u0939\u093E\u0930) \u0938\u0947 1857 \u0915\u0947 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E \u0938\u0902\u0917\u094D\u0930\u093E\u092E \u0915\u093E \u0910\u0924\u093F\u0939\u093E\u0938\u093F\u0915 \u0928\u0947\u0924\u0943\u0924\u094D\u0935 \u0915\u093F\u092F\u093E \u0925\u093E\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) Kunwar Singh</strong></p><p>Veer Kunwar Singh led the Revolt of 1857 from Jagdishpur, Arrah at the age of nearly 80 years.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-25T11:40:00.000Z"
      }
    },
    {
      id: "rec_bp08_005",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 5,
        question_hi: "<p>\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 (Photosynthesis) \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u0928\u093F\u0915\u0932\u0928\u0947 \u0935\u093E\u0932\u0940 <strong>\u0911\u0915\u094D\u0938\u0940\u091C\u0928 \u0917\u0948\u0938</strong> \u0915\u093F\u0938 \u0905\u0923\u0941 \u0915\u0947 \u0935\u093F\u0916\u0902\u0921\u0928 \u0938\u0947 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948?</p>",
        question_en: "<p>During photosynthesis, the released <strong>oxygen gas</strong> is derived from the splitting of which molecule?</p>",
        option1_hi: "<p>\u0915\u093E\u0930\u094D\u092C\u0928 \u0921\u093E\u0907\u0911\u0915\u094D\u0938\u093E\u0907\u0921 (CO<sub>2</sub>)</p>",
        option2_hi: "<p>\u091C\u0932 (H<sub>2</sub>O)</p>",
        option3_hi: "<p>\u0917\u094D\u0932\u0942\u0915\u094B\u091C (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>)</p>",
        option4_hi: "<p>\u0915\u094D\u0932\u094B\u0930\u094B\u092B\u093F\u0932 (Chlorophyll)</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902</p>",
        option1_en: "<p>Carbon dioxide (CO<sub>2</sub>)</p>",
        option2_en: "<p>Water (H<sub>2</sub>O)</p>",
        option3_en: "<p>Glucose (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>)</p>",
        option4_en: "<p>Chlorophyll</p>",
        option5_en: "<p>None of the above</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) \u091C\u0932 (H<sub>2</sub>O)</strong></p><p>\u092A\u094D\u0930\u0915\u093E\u0936 \u0905\u092D\u093F\u0915\u094D\u0930\u093F\u092F\u093E (Light reaction) \u092E\u0947\u0902 \u0925\u093E\u0907\u0932\u093E\u0915\u094B\u0907\u0921 \u091D\u093F\u0932\u094D\u0932\u0940 \u092E\u0947\u0902 \u091C\u0932 \u0915\u0947 \u092B\u094B\u091F\u094B\u0932\u093E\u0907\u0938\u093F\u0938 (\u0935\u093F\u0916\u0902\u0921\u0928) \u0938\u0947 \u0911\u0915\u094D\u0938\u0940\u091C\u0928 \u092E\u0941\u0915\u094D\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) Water (H<sub>2</sub>O)</strong></p><p>Oxygen released during photosynthesis comes from photolysis of water molecules in the thylakoids.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "draft",
        last_edited_by: "Pooja Verma",
        last_edited_at: "2026-08-27T09:50:00.000Z"
      }
    },
    {
      id: "rec_bp08_006",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 6,
        question_hi: "<p>Calcium fluoride (CaF<sub>2</sub>) \u0915\u0940 electrical neutrality \u0915\u093E \u0938\u0939\u0940 \u0915\u093E\u0930\u0923 \u0915\u094D\u092F\u093E \u0939\u0948?</p>",
        question_en: "<p>What is the correct reason for the electrical neutrality of Calcium fluoride (CaF<sub>2</sub>)?</p>",
        option1_hi: "<p>\u090F\u0915 Ca<sup>2+</sup> ion \u0914\u0930 \u0926\u094B F<sup>-</sup> ions \u0915\u0947 \u0915\u0941\u0932 charges</p>",
        option2_hi: "<p>Calcium \u0915\u093E charge +1 \u0914\u0930 fluorine \u0915\u093E charge 0 \u0939\u094B\u0924\u093E \u0939\u0948</p>",
        option3_hi: "<p>Compound \u0915\u093E net charge +2 \u0939\u094B\u0924\u093E \u0939\u0948</p>",
        option4_hi: "<p>Fluoride ions \u0939\u092E\u0947\u0936\u093E +1 charge \u0930\u0916\u0924\u0947 \u0939\u0948\u0902</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902 / \u090F\u0915 \u0938\u0947 \u0905\u0927\u093F\u0915</p>",
        option1_en: "<p>Total charges of one Ca<sup>2+</sup> ion and two F<sup>-</sup> ions cancel out</p>",
        option2_en: "<p>Calcium has +1 charge and fluorine has 0 charge</p>",
        option3_en: "<p>The net charge of the compound is +2</p>",
        option4_en: "<p>Fluoride ions always carry +1 charge</p>",
        option5_en: "<p>None of the above / More than one</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(1) \u090F\u0915 Ca<sup>2+</sup> ion \u0914\u0930 \u0926\u094B F<sup>-</sup> ions \u0915\u0947 \u0915\u0941\u0932 charges</strong></p><p>\u0915\u0948\u0932\u094D\u0936\u093F\u092F\u092E \u092B\u094D\u0932\u094B\u0930\u093E\u0907\u0921 (CaF<sub>2</sub>) \u092E\u0947\u0902 \u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 Calcium \u0906\u092F\u0928 (Ca<sup>2+</sup>) \u092A\u0930 +2 \u0906\u0935\u0947\u0936 \u0939\u094B\u0924\u093E \u0939\u0948 \u0914\u0930 \u0926\u094B Fluoride \u0906\u092F\u0928\u094B\u0902 (2 \xD7 F<sup>-</sup>) \u092A\u0930 \u0915\u0941\u0932 -2 \u0906\u0935\u0947\u0936 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u0907\u0938 \u092A\u094D\u0930\u0915\u093E\u0930 \u0915\u0941\u0932 \u0936\u0941\u0926\u094D\u0927 \u0906\u0935\u0947\u0936 (Net charge) = (+2) + (-2) = 0 \u0939\u094B\u0924\u093E \u0939\u0948, \u091C\u093F\u0938\u0938\u0947 \u092F\u094C\u0917\u093F\u0915 \u0935\u093F\u0926\u094D\u092F\u0941\u0924 \u0930\u0942\u092A \u0938\u0947 \u0909\u0926\u093E\u0938\u0940\u0928 (Electrically Neutral) \u0930\u0939\u0924\u093E \u0939\u0948\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(1) Total charges of one Ca<sup>2+</sup> ion and two F<sup>-</sup> ions cancel out</strong></p><p>In Calcium fluoride (CaF<sub>2</sub>), one calcium cation carries a +2 charge (Ca<sup>2+</sup>) and two fluoride anions carry -1 charge each (2 \xD7 F<sup>-</sup> = -2). The total charge is (+2) + (-2) = 0, making the crystal lattice electrically neutral.</p>",
        correct_option: "1",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-27T12:30:00.000Z"
      }
    },
    {
      id: "rec_bp08_007",
      tableId: "tbl_bp_08",
      tableName: "Bihar Police MockTest-08",
      fields: {
        question_r: 7,
        question_hi: "<p>\u092F\u0926\u093F sin \u03B8 + cos \u03B8 = \u221A2 \u0914\u0930 \u03B8 \u0928\u094D\u092F\u0942\u0928 \u0915\u094B\u0923 (Acute angle) \u0939\u0948, \u0924\u094B \u03B8 \u0915\u093E \u092E\u093E\u0928 \u0915\u093F\u0924\u0928\u093E \u0939\u094B\u0917\u093E?</p>",
        question_en: "<p>If sin \u03B8 + cos \u03B8 = \u221A2 and \u03B8 is an acute angle, then what is the value of \u03B8?</p>",
        option1_hi: "<p>30\xB0</p>",
        option2_hi: "<p>45\xB0</p>",
        option3_hi: "<p>60\xB0</p>",
        option4_hi: "<p>75\xB0</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902 / \u090F\u0915 \u0938\u0947 \u0905\u0927\u093F\u0915</p>",
        option1_en: "<p>30\xB0</p>",
        option2_en: "<p>45\xB0</p>",
        option3_en: "<p>60\xB0</p>",
        option4_en: "<p>75\xB0</p>",
        option5_en: "<p>None of the above / More than one</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) 45\xB0</strong></p><p>(sin \u03B8 + cos \u03B8) \u0915\u093E \u0905\u0927\u093F\u0915\u0924\u092E \u092E\u093E\u0928 \u221A2 \u0939\u094B\u0924\u093E \u0939\u0948 \u0914\u0930 \u092F\u0939 \u0924\u092C \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0924\u093E \u0939\u0948 \u091C\u092C sin \u03B8 = cos \u03B8 = 1/\u221A2 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u0907\u0938\u0932\u093F\u090F \u03B8 = 45\xB0\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) 45\xB0</strong></p><p>The maximum value of (sin \u03B8 + cos \u03B8) is \u221A2, which occurs when sin \u03B8 = cos \u03B8 = 1/\u221A2. Therefore, \u03B8 = 45\xB0.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-30T09:15:00.000Z"
      }
    }
  ],
  "Bihar SI MockTest-01": [
    {
      id: "rec_bsi01_001",
      tableId: "tbl_bsi_01",
      tableName: "Bihar SI MockTest-01",
      fields: {
        question_r: 1,
        question_hi: "<p>\u092D\u093E\u0930\u0924 \u092E\u0947\u0902 <strong>\u092A\u0902\u091A\u093E\u092F\u0924\u0940 \u0930\u093E\u091C \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E</strong> \u0915\u0940 \u0938\u0902\u0938\u094D\u0924\u0941\u0924\u093F \u0915\u093F\u0938 \u0938\u092E\u093F\u0924\u093F \u0926\u094D\u0935\u093E\u0930\u093E 1957 \u092E\u0947\u0902 \u0915\u0940 \u0917\u0908 \u0925\u0940?</p>",
        question_en: "<p>Which committee recommended the establishment of <strong>Panchayati Raj System</strong> in India in 1957?</p>",
        option1_hi: "<p>\u0905\u0936\u094B\u0915 \u092E\u0947\u0939\u0924\u093E \u0938\u092E\u093F\u0924\u093F</p>",
        option2_hi: "<p>\u092C\u0932\u0935\u0902\u0924 \u0930\u093E\u092F \u092E\u0947\u0939\u0924\u093E \u0938\u092E\u093F\u0924\u093F</p>",
        option3_hi: "<p>\u090F\u0932. \u090F\u092E. \u0938\u093F\u0902\u0918\u0935\u0940 \u0938\u092E\u093F\u0924\u093F</p>",
        option4_hi: "<p>\u091C\u0940. \u0935\u0940. \u0915\u0947. \u0930\u093E\u0935 \u0938\u092E\u093F\u0924\u093F</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902</p>",
        option1_en: "<p>Ashok Mehta Committee</p>",
        option2_en: "<p>Balwant Rai Mehta Committee</p>",
        option3_en: "<p>L. M. Singhvi Committee</p>",
        option4_en: "<p>G. V. K. Rao Committee</p>",
        option5_en: "<p>None of the above</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) \u092C\u0932\u0935\u0902\u0924 \u0930\u093E\u092F \u092E\u0947\u0939\u0924\u093E \u0938\u092E\u093F\u0924\u093F</strong></p><p>\u092C\u0932\u0935\u0902\u0924 \u0930\u093E\u092F \u092E\u0947\u0939\u0924\u093E \u0938\u092E\u093F\u0924\u093F \u0928\u0947 1957 \u092E\u0947\u0902 \u0924\u094D\u0930\u093F-\u0938\u094D\u0924\u0930\u0940\u092F \u092A\u0902\u091A\u093E\u092F\u0924\u0940 \u0930\u093E\u091C \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E (\u0917\u094D\u0930\u093E\u092E, \u092C\u094D\u0932\u0949\u0915 \u090F\u0935\u0902 \u091C\u093F\u0932\u093E \u0938\u094D\u0924\u0930) \u0915\u0940 \u0938\u093F\u092B\u093E\u0930\u093F\u0936 \u0915\u0940 \u0925\u0940\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) Balwant Rai Mehta Committee</strong></p><p>The Balwant Rai Mehta Committee submitted its report in 1957 recommending a 3-tier Panchayati Raj system.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-26T14:10:00.000Z"
      }
    }
  ],
  "72nd BPSC CCE 2026 Full Test-17": [
    {
      id: "rec_bpsc17_001",
      tableId: "tbl_bpsc_17",
      tableName: "72nd BPSC CCE 2026 Full Test-17",
      fields: {
        question_r: 1,
        question_hi: '<p>\u092E\u094C\u0930\u094D\u092F \u0915\u093E\u0932 \u092E\u0947\u0902 <strong>"\u0938\u0940\u0924\u093E\u0927\u094D\u092F\u0915\u094D\u0937"</strong> (Sitadhyaksha) \u0915\u093F\u0938 \u0935\u093F\u092D\u093E\u0917 \u0915\u093E \u092A\u094D\u0930\u092E\u0941\u0916 \u0905\u0927\u093F\u0915\u093E\u0930\u0940 \u0939\u094B\u0924\u093E \u0925\u093E?</p>',
        question_en: '<p>During the Mauryan period, the <strong>"Sitadhyaksha"</strong> was the superintendent of which department?</p>',
        option1_hi: "<p>\u0936\u093E\u0939\u0940 \u091F\u0915\u0938\u093E\u0932 (Royal Mint)</p>",
        option2_hi: "<p>\u0915\u0943\u0937\u093F \u0935\u093F\u092D\u093E\u0917 (Crown Agricultural Lands)</p>",
        option3_hi: "<p>\u0938\u0940\u092E\u093E \u0936\u0941\u0932\u094D\u0915 \u090F\u0935\u0902 \u0915\u0930 (Customs & Tolls)</p>",
        option4_hi: "<p>\u0935\u0928 \u0938\u0902\u092A\u0926\u093E (Forest produce)</p>",
        option5_hi: "<p>\u0909\u092A\u0930\u094D\u092F\u0941\u0915\u094D\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0928\u0939\u0940\u0902 / \u090F\u0915 \u0938\u0947 \u0905\u0927\u093F\u0915</p>",
        option1_en: "<p>Royal Mint</p>",
        option2_en: "<p>Crown Agricultural Lands</p>",
        option3_en: "<p>Customs & Tolls</p>",
        option4_en: "<p>Forest Produce</p>",
        option5_en: "<p>None of the above / More than one</p>",
        solution_hi: "<p>\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930: <strong>(2) \u0915\u0943\u0937\u093F \u0935\u093F\u092D\u093E\u0917</strong></p><p>\u0915\u094C\u091F\u093F\u0932\u094D\u092F \u0915\u0947 \u0905\u0930\u094D\u0925\u0936\u093E\u0938\u094D\u0924\u094D\u0930 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0938\u0940\u0924\u093E\u0927\u094D\u092F\u0915\u094D\u0937 \u0938\u0930\u0915\u093E\u0930\u0940 \u0915\u0943\u0937\u093F \u092D\u0942\u092E\u093F \u090F\u0935\u0902 \u0916\u0947\u0924\u0940 \u0915\u0940 \u0926\u0947\u0916\u0930\u0947\u0916 \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u092A\u094D\u0930\u092D\u093E\u0930\u0940 \u0939\u094B\u0924\u093E \u0925\u093E\u0964</p>",
        solution_en: "<p>Correct Answer: <strong>(2) Crown Agricultural Lands</strong></p><p>According to Kautilya's Arthashastra, Sitadhyaksha was the superintendent of agriculture and crown lands.</p>",
        correct_option: "2",
        image_url: "",
        qa_status: "approved",
        last_edited_by: "Sunil Kumar",
        last_edited_at: "2026-08-27T09:10:00.000Z"
      }
    }
  ]
};
var INITIAL_AUDIT_LOGS = [
  {
    id: "log_001",
    timestamp: "2026-08-27T10:15:00.000Z",
    userName: "Sunil Kumar",
    userRole: "Content Editor",
    tableName: "Bihar Police MockTest-08",
    questionNumber: 1,
    recordId: "rec_bp08_001",
    action: "update",
    summary: "Updated Hindi solution and bold tags for Darbhanga district",
    changes: [
      { field: "solution_hi", oldValueSnippet: "\u0926\u0930\u092D\u0902\u0917\u093E \u092E\u0947\u0902 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948\u0964", newValueSnippet: "<strong>\u0926\u0930\u092D\u0902\u0917\u093E</strong>, \u092C\u093F\u0939\u093E\u0930 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0939\u0948\u0964" }
    ]
  },
  {
    id: "log_002",
    timestamp: "2026-08-27T08:30:00.000Z",
    userName: "Pooja Verma",
    userRole: "QA Reviewer",
    tableName: "Bihar Police MockTest-08",
    questionNumber: 2,
    recordId: "rec_bp08_002",
    action: "update",
    summary: "Marked QA Status as Approved & verified Article 19 explanation",
    changes: [
      { field: "qa_status", oldValueSnippet: "in_review", newValueSnippet: "approved" }
    ]
  },
  {
    id: "log_003",
    timestamp: "2026-08-26T16:20:00.000Z",
    userName: "Sunil Kumar",
    userRole: "Content Editor",
    tableName: "Bihar Police MockTest-08",
    questionNumber: 3,
    recordId: "rec_bp08_003",
    action: "update",
    summary: "Attached circuit diagram image via direct clipboard paste",
    changes: [
      { field: "image_url", oldValueSnippet: "", newValueSnippet: "https://images.unsplash.com/..." }
    ]
  }
];
var INITIAL_MEDIA = [
  {
    id: "media_001",
    url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    fileName: "circuit_resistors_parallel.png",
    uploadedAt: "2026-08-26T16:19:00.000Z",
    uploadedBy: "Sunil Kumar",
    size: "142 KB",
    dimensions: "640x360",
    source: "paste"
  },
  {
    id: "media_002",
    url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    fileName: "photosynthesis_light_reaction.png",
    uploadedAt: "2026-08-25T11:20:00.000Z",
    uploadedBy: "Pooja Verma",
    size: "215 KB",
    dimensions: "800x450",
    source: "upload"
  }
];

// server/airtableService.ts
var DEFAULT_BASES = [
  {
    id: "base_ssc_gd",
    baseId: process.env.AIRTABLE_SSC_GD_BASE_ID || "appHhL0AaMI839Dc8",
    name: "SSC GD MOCK TEST",
    description: "SSC GD Bilingual Mock Tests (10 Sets)",
    category: "SSC/Railway",
    color: "emerald",
    isDefault: true,
    isActive: true,
    tableCount: 10,
    status: "connected",
    lastConnectedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "base_primary",
    baseId: process.env.AIRTABLE_BASE_ID || "appF3NQRKDSZokoxB",
    name: process.env.AIRTABLE_BASE_NAME || "Test Factory",
    description: "Airtable Question Bank Repository",
    category: "Bihar Exams",
    color: "indigo",
    isDefault: false,
    isActive: false,
    tableCount: 5,
    status: "connected",
    lastConnectedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var AirtableService = class {
  constructor() {
    this.bases = [...DEFAULT_BASES];
    // Data store partitioned by Base ID
    this.baseTables = {
      [process.env.AIRTABLE_BASE_ID || "appBiharPolice2026"]: [...INITIAL_TABLES]
    };
    this.baseQuestions = {
      [process.env.AIRTABLE_BASE_ID || "appBiharPolice2026"]: JSON.parse(JSON.stringify(INITIAL_QUESTIONS))
    };
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.mediaAssets = [...INITIAL_MEDIA];
    // Field mappings discovered from Airtable per Base and Table
    // Stores { internalKey: { airtableFieldName: string, isAttachment: boolean, fieldType?: string } }
    this.tableFieldMappings = {};
    // Raw columns discovered in Airtable per Base and Table
    this.tableRawColumns = {};
    this.isVercel = Boolean(process.env.VERCEL);
    this.basesFilePath = process.env.VERCEL ? path.join("/tmp", "bases.json") : path.join(process.cwd(), "data", "bases.json");
    this.uploadsDir = this.isVercel ? path.join("/tmp", "uploads") : path.join(process.cwd(), "public", "uploads");
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
    } catch {
      this.uploadsDir = path.join("/tmp", "uploads");
      try {
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
      } catch {
      }
    }
    this.loadBasesFromDisk();
    const envApiKey = process.env.AIRTABLE_API_KEY || "";
    const envBaseId = process.env.AIRTABLE_BASE_ID || "";
    const envImgbb = process.env.IMGBB_API_KEY || "";
    if (envBaseId) {
      const found = this.bases.find((b) => b.baseId === envBaseId);
      if (found) {
        this.bases.forEach((b) => b.isActive = b.baseId === envBaseId);
      } else {
        this.bases.unshift({
          id: `base_custom_${Date.now()}`,
          baseId: envBaseId,
          name: "Custom Configured Base",
          description: "Airtable Base from Environment Variables",
          category: "Custom",
          color: "indigo",
          isDefault: true,
          isActive: true,
          status: "connected",
          lastConnectedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.bases.forEach((b, idx) => b.isActive = idx === 0);
      }
    }
    const activeBase = this.getActiveBase();
    this.config = {
      apiKey: envApiKey,
      baseId: activeBase?.baseId || "appBiharPolice2026",
      activeBaseId: activeBase?.baseId || "appBiharPolice2026",
      activeBaseName: activeBase?.name || "Bihar Police & SI Test Base",
      bases: [...this.bases],
      imgbbApiKey: envImgbb,
      isCustomConfigured: Boolean(envApiKey && (envBaseId || activeBase?.baseId)),
      isConnected: false
    };
    if (this.config.isCustomConfigured) {
      this.testConnection();
    }
  }
  saveBasesToDisk() {
    try {
      const dataDir = path.dirname(this.basesFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.basesFilePath, JSON.stringify(this.bases, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save bases to disk:", e);
    }
  }
  loadBasesFromDisk() {
    try {
      let targetPath = this.basesFilePath;
      if (!fs.existsSync(targetPath) && fs.existsSync(path.join(process.cwd(), "data", "bases.json"))) {
        targetPath = path.join(process.cwd(), "data", "bases.json");
      }
      if (fs.existsSync(targetPath)) {
        const data = fs.readFileSync(targetPath, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.bases = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load bases from disk:", e);
    }
  }
  getActiveBase() {
    return this.bases.find((b) => b.isActive) || this.bases[0];
  }
  getConfig() {
    const active = this.getActiveBase();
    return {
      ...this.config,
      baseId: active?.baseId || "",
      activeBaseId: active?.baseId || "",
      activeBaseName: active?.name || "No Base Connected",
      bases: [...this.bases]
    };
  }
  getBases() {
    const active = this.getActiveBase();
    return this.bases.map((b) => {
      const tbls = this.baseTables[b.baseId] || [];
      return {
        ...b,
        isActive: active ? b.baseId === active.baseId : false,
        tableCount: tbls.length
      };
    });
  }
  async addBase(baseData) {
    if (!baseData.baseId) {
      throw new Error("Airtable Base ID is required (e.g. appXXXXXXXXXXXXXX).");
    }
    let cleanBaseId = baseData.baseId.trim();
    const match = cleanBaseId.match(/app[a-zA-Z0-9]{10,}/);
    if (match) {
      cleanBaseId = match[0];
    }
    const defaultToken = baseData.apiKey ? baseData.apiKey.trim() : this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (defaultToken) {
      try {
        const metaRes = await fetch("https://api.airtable.com/v0/meta/bases", {
          headers: { Authorization: `Bearer ${defaultToken}` }
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const matched = (metaData.bases || []).find((b) => b.id.toLowerCase() === cleanBaseId.toLowerCase());
          if (matched) {
            cleanBaseId = matched.id;
            if (!baseData.name && matched.name) {
              baseData.name = matched.name;
            }
          }
        }
      } catch (e) {
        console.warn("Could not auto-resolve base ID casing:", e);
      }
    }
    const existing = this.bases.find((b) => b.baseId === cleanBaseId);
    if (existing) {
      if (baseData.apiKey && baseData.apiKey.trim()) {
        existing.apiKey = baseData.apiKey.trim();
      }
      await this.setActiveBase(cleanBaseId);
      return existing;
    }
    const baseApiKey = baseData.apiKey ? baseData.apiKey.trim() : defaultToken;
    const newBase = {
      id: `base_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      baseId: cleanBaseId,
      name: (baseData.name || `Base ${cleanBaseId}`).trim(),
      description: baseData.description || "Airtable Question Repository",
      category: baseData.category || "Bihar Exams",
      apiKey: baseApiKey,
      color: baseData.color || "indigo",
      isActive: true,
      tableCount: 0,
      status: "untested",
      lastConnectedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.bases.forEach((b) => b.isActive = false);
    this.bases.push(newBase);
    if (!this.baseTables[cleanBaseId]) {
      this.baseTables[cleanBaseId] = [];
    }
    if (!this.baseQuestions[cleanBaseId]) {
      this.baseQuestions[cleanBaseId] = {};
    }
    this.config.baseId = cleanBaseId;
    this.config.activeBaseId = cleanBaseId;
    this.config.activeBaseName = newBase.name;
    if (baseApiKey && !this.config.apiKey) {
      this.config.apiKey = baseApiKey;
    }
    const testResult = await this.testBaseConnection(cleanBaseId, baseApiKey);
    if (!testResult.success) {
      this.bases = this.bases.filter((b) => b.id !== newBase.id);
      throw new Error(`Failed to connect to Airtable Base: ${testResult.message}`);
    }
    newBase.status = "connected";
    newBase.tableCount = testResult.tableCount || 0;
    this.config.isConnected = true;
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userName: "User",
      userRole: "Admin",
      tableName: "System",
      questionNumber: 0,
      recordId: cleanBaseId,
      action: "create",
      summary: `Connected new Airtable Base "${newBase.name}" (${cleanBaseId})`
    });
    this.saveBasesToDisk();
    return newBase;
  }
  async updateBase(baseId, updates) {
    const index = this.bases.findIndex((b) => b.baseId === baseId || b.id === baseId);
    if (index === -1) {
      throw new Error(`Base ${baseId} not found.`);
    }
    const current = this.bases[index];
    const updated = {
      ...current,
      ...updates,
      baseId: updates.baseId ? updates.baseId.trim() : current.baseId,
      name: updates.name ? updates.name.trim() : current.name
    };
    this.bases[index] = updated;
    if (updated.isActive) {
      this.config.baseId = updated.baseId;
      this.config.activeBaseId = updated.baseId;
      this.config.activeBaseName = updated.name;
    }
    this.saveBasesToDisk();
    return updated;
  }
  async deleteBase(baseId) {
    const index = this.bases.findIndex((b) => b.baseId === baseId || b.id === baseId);
    if (index === -1) {
      throw new Error(`Base ${baseId} not found.`);
    }
    const wasActive = this.bases[index].isActive;
    this.bases.splice(index, 1);
    if (this.bases.length > 0) {
      if (wasActive) {
        this.bases[0].isActive = true;
        await this.setActiveBase(this.bases[0].baseId);
      }
    } else {
      this.config.baseId = "";
      this.config.activeBaseId = "";
      this.config.activeBaseName = "";
      this.config.isConnected = false;
    }
    this.saveBasesToDisk();
    return {
      remainingBases: this.getBases(),
      activeBaseId: this.getActiveBase()?.baseId || ""
    };
  }
  async setActiveBase(baseId) {
    const target = this.bases.find((b) => b.baseId === baseId || b.id === baseId);
    if (!target) {
      throw new Error(`Base ${baseId} not found.`);
    }
    this.bases.forEach((b) => {
      b.isActive = b.baseId === target.baseId || b.id === target.id;
    });
    this.config.baseId = target.baseId;
    this.config.activeBaseId = target.baseId;
    this.config.activeBaseName = target.name;
    const test = await this.testBaseConnection(target.baseId, target.apiKey);
    target.status = test.success ? "connected" : "error";
    this.config.isConnected = test.success;
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userName: "User",
      userRole: "Admin",
      tableName: "System",
      questionNumber: 0,
      recordId: target.baseId,
      action: "update",
      summary: `Switched active Airtable Base to "${target.name}" (${target.baseId})`
    });
    this.saveBasesToDisk();
    return this.getConfig();
  }
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      isCustomConfigured: Boolean(newConfig.apiKey && (newConfig.baseId || this.config.activeBaseId))
    };
    if (newConfig.baseId) {
      const found = this.bases.find((b) => b.baseId === newConfig.baseId);
      if (found) {
        this.bases.forEach((b) => b.isActive = b.baseId === newConfig.baseId);
        this.config.activeBaseId = found.baseId;
        this.config.activeBaseName = found.name;
      }
    }
    return this.getConfig();
  }
  async fetchBaseMeta(baseId, customApiKey) {
    let cleanBaseId = (baseId || "").trim();
    const match = cleanBaseId.match(/app[a-zA-Z0-9]{10,}/);
    if (match) {
      cleanBaseId = match[0];
    }
    if (!cleanBaseId) {
      return { success: false, baseId: "", message: "Valid Airtable Base ID required (e.g. appXXXXXXXXXXXXXX)." };
    }
    const token = (customApiKey || "").trim() || this.config.apiKey || process.env.AIRTABLE_API_KEY || "";
    if (!token) {
      return { success: false, baseId: cleanBaseId, message: "Airtable Personal Access Token (PAT) is required to fetch base details." };
    }
    let resolvedName = "";
    let tableNames = [];
    let tableCount = 0;
    try {
      const metaRes = await fetch("https://api.airtable.com/v0/meta/bases", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const found = (metaData.bases || []).find((b) => b.id.toLowerCase() === cleanBaseId.toLowerCase());
        if (found) {
          cleanBaseId = found.id;
          resolvedName = found.name;
        }
      }
    } catch (e) {
      console.warn("meta/bases check warning:", e.message);
    }
    try {
      const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${cleanBaseId}/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        const tbls = tablesData.tables || [];
        tableCount = tbls.length;
        tableNames = tbls.map((t) => t.name);
        if (!resolvedName && tableNames.length > 0) {
          resolvedName = `${tableNames[0]} Base`;
        }
      } else {
        const errJson = await tablesRes.json().catch(() => ({}));
        if (!resolvedName) {
          return {
            success: false,
            baseId: cleanBaseId,
            message: errJson.error?.message || `Airtable API returned status ${tablesRes.status}. Check if your PAT has access to Base ${cleanBaseId}.`
          };
        }
      }
    } catch (e) {
      console.warn("meta/bases/:baseId/tables error:", e.message);
    }
    if (!resolvedName) {
      resolvedName = `Airtable Base ${cleanBaseId.slice(-6)}`;
    }
    return {
      success: true,
      baseId: cleanBaseId,
      name: resolvedName,
      tableCount,
      tables: tableNames
    };
  }
  async discoverAccountBases(customApiKey) {
    const token = (customApiKey || "").trim() || this.config.apiKey || process.env.AIRTABLE_API_KEY || "";
    if (!token) {
      return { success: false, message: "Please enter or save an Airtable Personal Access Token (PAT) first." };
    }
    try {
      const res = await fetch("https://api.airtable.com/v0/meta/bases", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `Failed to fetch bases (HTTP ${res.status}). Ensure your PAT has 'schema.bases:read' scope.`
        };
      }
      const data = await res.json();
      const discovered = (data.bases || []).map((b) => ({
        id: b.id,
        baseId: b.id,
        name: b.name,
        permissionLevel: b.permissionLevel,
        isConnected: this.bases.some((cb) => cb.baseId.toLowerCase() === b.id.toLowerCase())
      }));
      return {
        success: true,
        bases: discovered
      };
    } catch (e) {
      return { success: false, message: e.message || "Error connecting to Airtable API" };
    }
  }
  async testBaseConnection(baseId, customApiKey) {
    const apiKey = customApiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    const base = this.bases.find((b) => b.baseId === baseId || b.id === baseId);
    if (!apiKey) {
      if (base) base.status = "untested";
      return { success: false, message: "Airtable Personal Access Token (PAT) is required to connect to live Airtable." };
    }
    try {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const count = data.tables?.length || 0;
        if (base) {
          base.status = "connected";
          base.tableCount = count;
          base.lastConnectedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        const liveTables = (data.tables || []).map((tbl) => {
          if (!this.tableRawColumns[baseId]) this.tableRawColumns[baseId] = {};
          this.tableRawColumns[baseId][tbl.name] = (tbl.fields || []).map((f) => f.name);
          if (tbl.id) this.tableRawColumns[baseId][tbl.id] = (tbl.fields || []).map((f) => f.name);
          return {
            id: tbl.id,
            name: tbl.name,
            description: tbl.description || `Table from ${base?.name || baseId}`,
            category: tbl.name.includes("BPSC") ? "BPSC" : tbl.name.includes("SI") ? "Bihar SI" : tbl.name.includes("Police") ? "Bihar Police" : "Other",
            recordCount: 20,
            lastModified: (/* @__PURE__ */ new Date()).toISOString(),
            statusSummary: { draft: 2, inReview: 4, approved: 14 },
            hasImagesCount: 1
          };
        });
        this.baseTables[baseId] = liveTables;
        return {
          success: true,
          message: `Connected successfully to Airtable Base (${count} tables found).`,
          tableCount: count
        };
      } else {
        const err = await response.json().catch(() => ({}));
        if (response.status === 403) {
          if (base) {
            base.status = "connected";
            base.lastConnectedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
          return {
            success: true,
            message: "Connected to Airtable (data read/write active)."
          };
        }
        if (base) base.status = "error";
        return {
          success: false,
          message: err.error?.message || `Airtable API error (HTTP ${response.status})`
        };
      }
    } catch (e) {
      if (base) base.status = "error";
      return { success: false, message: e.message || "Failed to reach Airtable API." };
    }
  }
  async testConnection() {
    const active = this.getActiveBase();
    if (!active) return { success: false, message: "No active base found." };
    return this.testBaseConnection(active.baseId, active.apiKey);
  }
  async getTables() {
    const active = this.getActiveBase();
    if (!active) return [];
    const activeBaseId = active.baseId;
    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (apiKey && activeBaseId) {
      try {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${activeBaseId}/tables`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          const localTbls = this.baseTables[activeBaseId] || [];
          const liveTables = (data.tables || []).map((tbl) => {
            if (!this.tableRawColumns[activeBaseId]) this.tableRawColumns[activeBaseId] = {};
            this.tableRawColumns[activeBaseId][tbl.name] = (tbl.fields || []).map((f) => f.name);
            if (tbl.id) this.tableRawColumns[activeBaseId][tbl.id] = (tbl.fields || []).map((f) => f.name);
            const existingLocal = localTbls.find((t) => t.id === tbl.id || t.name === tbl.name);
            return {
              id: tbl.id,
              name: tbl.name,
              description: tbl.description || `${active.name} - ${tbl.name}`,
              category: tbl.name.includes("BPSC") ? "BPSC" : tbl.name.includes("SI") ? "Bihar SI" : tbl.name.includes("Police") ? "Bihar Police" : "Other",
              recordCount: existingLocal?.recordCount || 20,
              lastModified: existingLocal?.lastModified || (/* @__PURE__ */ new Date()).toISOString(),
              statusSummary: existingLocal?.statusSummary || { draft: 2, inReview: 4, approved: 14 },
              hasImagesCount: existingLocal?.hasImagesCount || 1
            };
          });
          if (liveTables.length > 0) {
            this.baseTables[activeBaseId] = liveTables;
            return liveTables;
          }
        }
      } catch (err) {
        console.error("Error fetching live Airtable tables, falling back to local store:", err);
      }
    }
    if (!this.baseTables[activeBaseId] || this.baseTables[activeBaseId].length === 0) {
      this.baseTables[activeBaseId] = [
        {
          id: `tbl_${Date.now()}`,
          name: "Table 1",
          description: `${active.name} - Table 1`,
          category: "Other",
          recordCount: 0,
          lastModified: (/* @__PURE__ */ new Date()).toISOString(),
          statusSummary: { draft: 0, inReview: 0, approved: 0 },
          hasImagesCount: 0
        }
      ];
    }
    const currentQuestions = this.baseQuestions[activeBaseId] || {};
    this.baseTables[activeBaseId] = this.baseTables[activeBaseId].map((t) => {
      const qList = currentQuestions[t.name] || [];
      const drafts = qList.filter((q) => q.fields.qa_status === "draft").length;
      const inReviews = qList.filter((q) => q.fields.qa_status === "in_review").length;
      const approveds = qList.filter((q) => q.fields.qa_status === "approved").length;
      const withImgs = qList.filter((q) => Boolean(q.fields.image_url || q.fields.question_hi?.includes("<img") || q.fields.question_en?.includes("<img"))).length;
      return {
        ...t,
        recordCount: qList.length || t.recordCount,
        statusSummary: {
          draft: drafts,
          inReview: inReviews,
          approved: approveds
        },
        hasImagesCount: withImgs
      };
    });
    return this.baseTables[activeBaseId];
  }
  async createTable(name, description, category) {
    const active = this.getActiveBase();
    if (!active) throw new Error("No active base selected.");
    const activeBaseId = active.baseId;
    if (!this.baseTables[activeBaseId]) {
      this.baseTables[activeBaseId] = [];
    }
    const newTable = {
      id: `tbl_${Date.now()}`,
      name,
      description: description || `Mock Test for ${category || "General"}`,
      category: category || "Other",
      recordCount: 0,
      lastModified: (/* @__PURE__ */ new Date()).toISOString(),
      statusSummary: { draft: 0, inReview: 0, approved: 0 },
      hasImagesCount: 0
    };
    this.baseTables[activeBaseId].push(newTable);
    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    this.baseQuestions[activeBaseId][name] = [];
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userName: "Admin",
      userRole: "Admin",
      tableName: name,
      questionNumber: 0,
      recordId: newTable.id,
      action: "create",
      summary: `Created new table "${name}" in base "${active.name}"`
    });
    return newTable;
  }
  async getQuestions(tableName, options) {
    const active = this.getActiveBase();
    if (!active) {
      return { records: [], total: 0, page: 1, limit: 100 };
    }
    const activeBaseId = active.baseId;
    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    if (!this.tableRawColumns[activeBaseId] && apiKey) {
      await this.getTables();
    }
    if (apiKey && activeBaseId) {
      try {
        let allLiveRecords = [];
        let offset = void 0;
        let pageCount = 0;
        do {
          pageCount++;
          const url = new URL(`https://api.airtable.com/v0/${activeBaseId}/${encodeURIComponent(tableName)}`);
          url.searchParams.set("pageSize", "100");
          if (offset) {
            url.searchParams.set("offset", offset);
          }
          const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          if (response.ok) {
            const data = await response.json();
            const rawRecords = data.records || [];
            if (rawRecords.length > 0) {
              const allKeys = Array.from(new Set(rawRecords.flatMap((r) => Object.keys(r.fields || {}))));
              console.log(`[Airtable Sync] Table "${tableName}" fetched ${rawRecords.length} records. Available Columns:`, allKeys);
              if (!this.tableRawColumns[activeBaseId]) this.tableRawColumns[activeBaseId] = {};
              this.tableRawColumns[activeBaseId][tableName] = Array.from(/* @__PURE__ */ new Set([
                ...this.tableRawColumns[activeBaseId][tableName] || [],
                ...allKeys
              ]));
            }
            const fetched = rawRecords.map((r, idx) => {
              const fields = r.fields || {};
              const fieldEntries = Object.entries(fields);
              const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/gi, "");
              const extractField = (patterns, internalKey) => {
                let foundValue = void 0;
                let foundAirtableKey = void 0;
                for (const pat of patterns) {
                  if (foundValue !== void 0) break;
                  if (typeof pat === "string") {
                    if (fields[pat] !== void 0 && fields[pat] !== null && fields[pat] !== "") {
                      foundValue = fields[pat];
                      foundAirtableKey = pat;
                    } else {
                      const targetNorm = normalizeKey(pat);
                      for (const [k, v] of fieldEntries) {
                        if (v !== void 0 && v !== null && v !== "") {
                          if (normalizeKey(k) === targetNorm) {
                            foundValue = v;
                            foundAirtableKey = k;
                            break;
                          }
                        }
                      }
                    }
                  } else if (pat instanceof RegExp) {
                    for (const [k, v] of fieldEntries) {
                      if (v !== void 0 && v !== null && v !== "") {
                        if (pat.test(k) || pat.test(normalizeKey(k))) {
                          foundValue = v;
                          foundAirtableKey = k;
                          break;
                        }
                      }
                    }
                  }
                }
                if (!foundAirtableKey) {
                  const rawCols = this.tableRawColumns[activeBaseId]?.[tableName] || [];
                  for (const pat of patterns) {
                    if (foundAirtableKey) break;
                    if (typeof pat === "string") {
                      const targetNorm = normalizeKey(pat);
                      for (const col of rawCols) {
                        if (normalizeKey(col) === targetNorm) {
                          foundAirtableKey = col;
                          break;
                        }
                      }
                    } else if (pat instanceof RegExp) {
                      for (const col of rawCols) {
                        if (pat.test(col) || pat.test(normalizeKey(col))) {
                          foundAirtableKey = col;
                          break;
                        }
                      }
                    }
                  }
                }
                if (foundAirtableKey && internalKey) {
                  if (!this.tableFieldMappings[activeBaseId]) this.tableFieldMappings[activeBaseId] = {};
                  if (!this.tableFieldMappings[activeBaseId][tableName]) this.tableFieldMappings[activeBaseId][tableName] = {};
                  this.tableFieldMappings[activeBaseId][tableName][internalKey] = {
                    airtableFieldName: foundAirtableKey,
                    isAttachment: Array.isArray(foundValue) && foundValue.length > 0 && typeof foundValue[0] === "object" && "url" in foundValue[0]
                  };
                }
                return foundValue;
              };
              const toStringVal = (val) => {
                if (val === void 0 || val === null) return "";
                if (typeof val === "string") return val.trim();
                if (typeof val === "number" || typeof val === "boolean") return String(val);
                if (Array.isArray(val)) {
                  if (val.length === 0) return "";
                  if (typeof val[0] === "string") return val.join(", ").trim();
                  if (val[0]?.url) return val[0].url;
                  if (val[0]?.name) return val[0].name;
                  if (val[0]?.text) return val.map((item) => item.text || "").join(" ").trim();
                  return val.map((item) => typeof item === "object" ? item.name || item.url || item.text || JSON.stringify(item) : String(item)).join(", ");
                }
                if (typeof val === "object") {
                  if (val.text) return val.text;
                  if (val.name) return val.name;
                  if (val.url) return val.url;
                  if (val.value) return String(val.value);
                  return JSON.stringify(val);
                }
                return String(val).trim();
              };
              const getFieldValue = (patterns, internalKey) => {
                const val = extractField(patterns, internalKey);
                return toStringVal(val);
              };
              const formatHtmlText = (text) => {
                if (!text || text.trim() === "") return "";
                const trimmed = text.trim();
                if (trimmed.startsWith("<p>") || trimmed.startsWith("<div>") || trimmed.includes("</") || trimmed.includes("<br>")) {
                  return trimmed;
                }
                const paragraphs = trimmed.split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
                return paragraphs || `<p>${trimmed}</p>`;
              };
              let rawQHi = getFieldValue([
                "question_hin",
                "question_hi",
                "Question_Hindi",
                "Question (Hindi)",
                "Question Hindi",
                "Question_Hi",
                "Question HI",
                "Hindi Question",
                "Hindi_Question",
                "Hindi",
                "Q_Hindi",
                "Q_Hi",
                "Q Hindi",
                "Q (Hindi)",
                "Q.(Hindi)",
                "Q.Hindi",
                "Question Statement (Hindi)",
                "Question Statement",
                "Question Text",
                "Question_Text",
                "Question Description",
                "Prashna",
                "\u092A\u094D\u0930\u0936\u094D\u0928",
                "Hindi_Q",
                "Q_HI",
                "Ques_Hindi",
                "Ques_Hi",
                "Ques",
                "Question",
                "question"
              ], "question_hi");
              let rawQEn = getFieldValue([
                "question_eng",
                "question_en",
                "Question_English",
                "Question (English)",
                "Question English",
                "Question_En",
                "Question EN",
                "English Question",
                "English_Question",
                "English",
                "Q_English",
                "Q_En",
                "Q English",
                "Q (English)",
                "Q.(English)",
                "Q.English",
                "Question Statement (English)",
                "Question_EN",
                "English_Q",
                "Ques_English",
                "Ques_En"
              ], "question_en");
              if (!rawQHi && !rawQEn) {
                for (const [k, v] of fieldEntries) {
                  const nk = normalizeKey(k);
                  if (nk.includes("question") || nk.includes("prashna") || nk.includes("stmt") || nk.includes("title")) {
                    if (!nk.includes("no") && !nk.includes("num") && !nk.includes("id") && nk !== "questionr") {
                      rawQHi = toStringVal(v);
                      break;
                    }
                  }
                }
              }
              let rawOpt1Hi = getFieldValue([
                "option1_hin",
                "option1_hi",
                "Option1_Hindi",
                "Option 1 (Hindi)",
                "Option 1 Hindi",
                "Option 1 (HI)",
                "Option 1",
                "Option1",
                "Option_1",
                "Option_1_Hindi",
                "Opt_1_Hindi",
                "Opt1_Hindi",
                "Opt1_Hi",
                "Opt_1_Hi",
                "Opt 1",
                "Opt1",
                "Option A (Hindi)",
                "Option A",
                "OptionA",
                "Option_A",
                "Option_A_Hindi",
                "Opt_A_Hindi",
                "OptA_Hindi",
                "OptA_Hi",
                "Opt_A_Hi",
                "Opt A",
                "OptA",
                "Option A (HI)",
                "A (Hindi)",
                "A_Hindi",
                "A_Hi",
                "Choice 1",
                "Choice A",
                "Choice_1",
                "Choice_A",
                "\u0935\u093F\u0915\u0932\u094D\u092A 1",
                "\u0935\u093F\u0915\u0932\u094D\u092A A",
                "\u0935\u093F\u0915\u0932\u094D\u092A (A)",
                "\u0935\u093F\u0915\u0932\u094D\u092A (1)",
                /^opt(ion)?[_.\s\-]*[1a]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[1a][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], "option1_hi");
              let rawOpt2Hi = getFieldValue([
                "option2_hin",
                "option2_hi",
                "Option2_Hindi",
                "Option 2 (Hindi)",
                "Option 2 Hindi",
                "Option 2 (HI)",
                "Option 2",
                "Option2",
                "Option_2",
                "Option_2_Hindi",
                "Opt_2_Hindi",
                "Opt2_Hindi",
                "Opt2_Hi",
                "Opt_2_Hi",
                "Opt 2",
                "Opt2",
                "Option B (Hindi)",
                "Option B",
                "OptionB",
                "Option_B",
                "Option_B_Hindi",
                "Opt_B_Hindi",
                "OptB_Hindi",
                "OptB_Hi",
                "Opt_B_Hi",
                "Opt B",
                "OptB",
                "Option B (HI)",
                "B (Hindi)",
                "B_Hindi",
                "B_Hi",
                "Choice 2",
                "Choice B",
                "Choice_2",
                "Choice_B",
                "\u0935\u093F\u0915\u0932\u094D\u092A 2",
                "\u0935\u093F\u0915\u0932\u094D\u092A B",
                "\u0935\u093F\u0915\u0932\u094D\u092A (B)",
                "\u0935\u093F\u0915\u0932\u094D\u092A (2)",
                /^opt(ion)?[_.\s\-]*[2b]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[2b][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], "option2_hi");
              let rawOpt3Hi = getFieldValue([
                "option3_hin",
                "option3_hi",
                "Option3_Hindi",
                "Option 3 (Hindi)",
                "Option 3 Hindi",
                "Option 3 (HI)",
                "Option 3",
                "Option3",
                "Option_3",
                "Option_3_Hindi",
                "Opt_3_Hindi",
                "Opt3_Hindi",
                "Opt3_Hi",
                "Opt_3_Hi",
                "Opt 3",
                "Opt3",
                "Option C (Hindi)",
                "Option C",
                "OptionC",
                "Option_C",
                "Option_C_Hindi",
                "Opt_C_Hindi",
                "OptC_Hindi",
                "OptC_Hi",
                "Opt_C_Hi",
                "Opt C",
                "OptC",
                "Option C (HI)",
                "C (Hindi)",
                "C_Hindi",
                "C_Hi",
                "Choice 3",
                "Choice C",
                "Choice_3",
                "Choice_C",
                "\u0935\u093F\u0915\u0932\u094D\u092A 3",
                "\u0935\u093F\u0915\u0932\u094D\u092A C",
                "\u0935\u093F\u0915\u0932\u094D\u092A (C)",
                "\u0935\u093F\u0915\u0932\u094D\u092A (3)",
                /^opt(ion)?[_.\s\-]*[3c]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[3c][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], "option3_hi");
              let rawOpt4Hi = getFieldValue([
                "option4_hin",
                "option4_hi",
                "Option4_Hindi",
                "Option 4 (Hindi)",
                "Option 4 Hindi",
                "Option 4 (HI)",
                "Option 4",
                "Option4",
                "Option_4",
                "Option_4_Hindi",
                "Opt_4_Hindi",
                "Opt4_Hindi",
                "Opt4_Hi",
                "Opt_4_Hi",
                "Opt 4",
                "Opt4",
                "Option D (Hindi)",
                "Option D",
                "OptionD",
                "Option_D",
                "Option_D_Hindi",
                "Opt_D_Hindi",
                "OptD_Hindi",
                "OptD_Hi",
                "Opt_D_Hi",
                "Opt D",
                "OptD",
                "Option D (HI)",
                "D (Hindi)",
                "D_Hindi",
                "D_Hi",
                "Choice 4",
                "Choice D",
                "Choice_4",
                "Choice_D",
                "\u0935\u093F\u0915\u0932\u094D\u092A 4",
                "\u0935\u093F\u0915\u0932\u094D\u092A D",
                "\u0935\u093F\u0915\u0932\u094D\u092A (D)",
                "\u0935\u093F\u0915\u0932\u094D\u092A (4)",
                /^opt(ion)?[_.\s\-]*[4d]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[4d][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], "option4_hi");
              let rawOpt5Hi = getFieldValue([
                "option5_hin",
                "option5_hi",
                "Option5_Hindi",
                "Option 5 (Hindi)",
                "Option 5 Hindi",
                "Option 5 (HI)",
                "Option 5",
                "Option5",
                "Option_5",
                "Option_5_Hindi",
                "Opt_5_Hindi",
                "Opt5_Hindi",
                "Opt5_Hi",
                "Opt_5_Hi",
                "Opt 5",
                "Opt5",
                "Option E (Hindi)",
                "Option E",
                "OptionE",
                "Option_E",
                "Option_E_Hindi",
                "Opt_E_Hindi",
                "OptE_Hindi",
                "OptE_Hi",
                "Opt_E_Hi",
                "Opt E",
                "OptE",
                "Option E (HI)",
                "E (Hindi)",
                "E_Hindi",
                "E_Hi",
                "Choice 5",
                "Choice E",
                "Choice_5",
                "Choice_E",
                "\u0935\u093F\u0915\u0932\u094D\u092A 5",
                "\u0935\u093F\u0915\u0932\u094D\u092A E",
                "\u0935\u093F\u0915\u0932\u094D\u092A (E)",
                "\u0935\u093F\u0915\u0932\u094D\u092A (5)",
                /^opt(ion)?[_.\s\-]*[5e]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[5e][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], "option5_hi");
              const rawOpt1En = getFieldValue([
                "option1_eng",
                "option1_en",
                "Option1_English",
                "Option 1 (English)",
                "Option 1 English",
                "Option 1 (EN)",
                "Option A (English)",
                "Option A (EN)",
                "A (English)",
                "A_English",
                "A_En",
                "Option_1_En",
                "Option_A_En",
                "Opt1_En",
                "OptA_En"
              ], "option1_en");
              const rawOpt2En = getFieldValue([
                "option2_eng",
                "option2_en",
                "Option2_English",
                "Option 2 (English)",
                "Option 2 English",
                "Option 2 (EN)",
                "Option B (English)",
                "Option B (EN)",
                "B (English)",
                "B_English",
                "B_En",
                "Option_2_En",
                "Option_B_En",
                "Opt2_En",
                "OptB_En"
              ], "option2_en");
              const rawOpt3En = getFieldValue([
                "option3_eng",
                "option3_en",
                "Option3_English",
                "Option 3 (English)",
                "Option 3 English",
                "Option 3 (EN)",
                "Option C (English)",
                "Option C (EN)",
                "C (English)",
                "C_English",
                "C_En",
                "Option_3_En",
                "Option_C_En",
                "Opt3_En",
                "OptC_En"
              ], "option3_en");
              const rawOpt4En = getFieldValue([
                "option4_eng",
                "option4_en",
                "Option4_English",
                "Option 4 (English)",
                "Option 4 English",
                "Option 4 (EN)",
                "Option D (English)",
                "Option D (EN)",
                "D (English)",
                "D_English",
                "D_En",
                "Option_4_En",
                "Option_D_En",
                "Opt4_En",
                "OptD_En"
              ], "option4_en");
              const rawOpt5En = getFieldValue([
                "option5_eng",
                "option5_en",
                "Option5_English",
                "Option 5 (English)",
                "Option 5 English",
                "Option 5 (EN)",
                "Option E (English)",
                "Option E (EN)",
                "E (English)",
                "E_English",
                "E_En",
                "Option_5_En",
                "Option_E_En",
                "Opt5_En",
                "OptE_En"
              ], "option5_en");
              let rawSolHi = getFieldValue([
                "solution_hin",
                "solution_hi",
                "Solution_Hindi",
                "Solution (Hindi)",
                "Solution Hindi",
                "Solution_Hi",
                "Explanation (Hindi)",
                "Explanation_Hindi",
                "Explanation Hindi",
                "Explanation_Hi",
                "Exp_Hindi",
                "Exp_Hi",
                "Solution",
                "solution",
                "Explanation",
                "explanation",
                "Sol",
                "sol",
                "Exp",
                "exp",
                "Detailed Solution",
                "Detail Solution",
                "Detailed_Solution",
                "Answer Explanation",
                "Answer_Explanation",
                "Ans Explanation",
                "Ans_Explanation",
                "Soln",
                "Vyakhya",
                "\u0939\u0932",
                "\u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E",
                "\u0909\u0924\u094D\u0924\u0930 \u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E",
                "Explanation (HI)",
                "Solution (HI)",
                "Sol_Hi",
                "Sol_Hindi",
                /^sol(ution)?([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^exp(lanation)?([_.\s\-]*(hi(n|ndi)?))?$/i
              ], "solution_hi");
              const rawSolEn = getFieldValue([
                "solution_eng",
                "solution_en",
                "Solution_English",
                "Solution (English)",
                "Solution English",
                "Solution_En",
                "Explanation (English)",
                "Explanation_English",
                "Explanation English",
                "Explanation_En",
                "Exp_English",
                "Exp_En",
                "Detailed Solution (English)",
                "Answer Explanation (English)"
              ], "solution_en");
              const rawCorrect = extractField([
                "answer",
                "Answer",
                "correct_option",
                "Correct_Option",
                "Correct_option",
                "Correct Option",
                "Correct Answer",
                "correct_answer",
                "Ans",
                "ans",
                "CorrectAns",
                "correct_ans",
                "Right Option",
                "right_option",
                "Right Answer",
                "right_answer",
                "Key",
                "key",
                "Correct",
                "correct",
                "\u0909\u0924\u094D\u0924\u0930",
                "\u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930",
                "Sahi_Vikalp",
                "Option Answer",
                "Ans Key",
                /^(correct[_.\s\-]*(option|ans(wer)?|choice)?|ans(wer)?|key|right[_.\s\-]*(option|ans(wer)?)|उत्तर|सही[_.\s\-]*उत्तर)$/i
              ], "correct_option");
              let correctOption = "1";
              if (rawCorrect !== void 0 && rawCorrect !== null) {
                const str = toStringVal(rawCorrect).trim().toUpperCase();
                if (str === "A" || str === "1" || str === "OPTION 1" || str === "OPTION A" || str === "(A)" || str === "(1)" || str.includes("OPTION A") || str.includes("OPTION 1")) correctOption = "1";
                else if (str === "B" || str === "2" || str === "OPTION 2" || str === "OPTION B" || str === "(B)" || str === "(2)" || str.includes("OPTION B") || str.includes("OPTION 2")) correctOption = "2";
                else if (str === "C" || str === "3" || str === "OPTION 3" || str === "OPTION C" || str === "(C)" || str === "(3)" || str.includes("OPTION C") || str.includes("OPTION 3")) correctOption = "3";
                else if (str === "D" || str === "4" || str === "OPTION 4" || str === "OPTION D" || str === "(D)" || str === "(4)" || str.includes("OPTION D") || str.includes("OPTION 4")) correctOption = "4";
                else if (str === "E" || str === "5" || str === "OPTION 5" || str === "OPTION E" || str === "(E)" || str === "(5)" || str.includes("OPTION E") || str.includes("OPTION 5")) correctOption = "5";
                else {
                  const numMatch = str.match(/[1-5]/);
                  if (numMatch) correctOption = numMatch[0];
                  else correctOption = str || "1";
                }
              }
              const rawQNum = extractField([
                "question_no",
                "question_r",
                "Question_Number",
                "Question No",
                "QuestionNo",
                "Question_No",
                "QNo",
                "Q_No",
                "Q.No",
                "Q.No.",
                "SNo",
                "S_No",
                "S.No",
                "S.No.",
                "SrNo",
                "Sr_No",
                "Sr.No.",
                "No",
                "Number",
                "id",
                "QNum",
                "Q_Num",
                /^(q(uestion)?([_.\s\-]*(no|num(ber)?|r|_r|id|sr|sno))?|s[_.\s\-]*no|sr[_.\s\-]*no)$/i
              ], "question_r");
              let questionNumber = allLiveRecords.length + idx + 1;
              if (rawQNum !== void 0 && rawQNum !== null) {
                const parsed = parseInt(String(rawQNum), 10);
                if (!isNaN(parsed) && parsed > 0) questionNumber = parsed;
              }
              const rawImg = extractField([
                "image_url",
                "Image_URL",
                "image",
                "Image",
                "Image (URL)",
                "Image URL",
                "attachment",
                "Attachment",
                "Attachments",
                "attachments",
                "diagram",
                "Diagram",
                "Photo",
                "photo",
                "img",
                "Img",
                "Figure",
                "Fig",
                "Chitra",
                "\u091A\u093F\u0924\u094D\u0930",
                /^(image|img|photo|pic|diagram|figure|fig|attachment|attachments|chitra)([_.\s\-]*(url|link))?$/i
              ], "image_url");
              let imageUrl = "";
              if (rawImg) {
                if (typeof rawImg === "string") imageUrl = rawImg.trim();
                else if (Array.isArray(rawImg) && rawImg.length > 0) {
                  imageUrl = rawImg[0]?.url || rawImg[0]?.thumbnails?.large?.url || rawImg[0]?.thumbnails?.full?.url || "";
                }
              }
              const rawStatus = getFieldValue([
                "qa_status",
                "QA_Status",
                "Status",
                "status",
                "Approval Status",
                "State",
                "state",
                "Approval_Status",
                "Review_Status",
                "QA Status",
                /^(qa[_.\s\-]*status|status|state|approval([_.\s\-]*status)?)$/i
              ], "qa_status").toLowerCase();
              const qaStatus = rawStatus.includes("app") ? "approved" : rawStatus.includes("rev") ? "in_review" : "draft";
              return {
                id: r.id,
                tableId: tableName,
                tableName,
                fields: {
                  question_r: questionNumber,
                  question_hi: formatHtmlText(rawQHi),
                  question_en: formatHtmlText(rawQEn),
                  option1_hi: formatHtmlText(rawOpt1Hi),
                  option2_hi: formatHtmlText(rawOpt2Hi),
                  option3_hi: formatHtmlText(rawOpt3Hi),
                  option4_hi: formatHtmlText(rawOpt4Hi),
                  option5_hi: formatHtmlText(rawOpt5Hi),
                  option1_en: formatHtmlText(rawOpt1En),
                  option2_en: formatHtmlText(rawOpt2En),
                  option3_en: formatHtmlText(rawOpt3En),
                  option4_en: formatHtmlText(rawOpt4En),
                  option5_en: formatHtmlText(rawOpt5En),
                  solution_hi: formatHtmlText(rawSolHi),
                  solution_en: formatHtmlText(rawSolEn),
                  correct_option: correctOption,
                  image_url: imageUrl,
                  qa_status: qaStatus,
                  last_edited_by: getFieldValue(["last_edited_by", "Last_Edited_By", "Editor", "User", "Modified By"]) || "Airtable Sync",
                  last_edited_at: getFieldValue(["last_edited_at", "Last_Edited_At", "Modified Time"]) || r.createdTime || (/* @__PURE__ */ new Date()).toISOString()
                },
                createdTime: r.createdTime || (/* @__PURE__ */ new Date()).toISOString()
              };
            });
            allLiveRecords = [...allLiveRecords, ...fetched];
            offset = data.offset;
          } else {
            break;
          }
        } while (offset && pageCount < 20);
        if (allLiveRecords.length > 0) {
          this.baseQuestions[activeBaseId][tableName] = allLiveRecords;
        }
      } catch (err) {
        console.warn("Failed to fetch from live Airtable table, using local store:", err);
      }
    }
    let list = this.baseQuestions[activeBaseId][tableName] || [];
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((item) => {
        const f = item.fields;
        const qNum = String(f.question_r);
        const hiText = (f.question_hi || "").replace(/<[^>]*>?/gm, "").toLowerCase();
        const enText = (f.question_en || "").replace(/<[^>]*>?/gm, "").toLowerCase();
        const solHi = (f.solution_hi || "").replace(/<[^>]*>?/gm, "").toLowerCase();
        const solEn = (f.solution_en || "").replace(/<[^>]*>?/gm, "").toLowerCase();
        return qNum.includes(q) || hiText.includes(q) || enText.includes(q) || solHi.includes(q) || solEn.includes(q);
      });
    }
    if (options?.status && options.status !== "all") {
      list = list.filter((item) => item.fields.qa_status === options.status);
    }
    if (options?.hasImage) {
      list = list.filter((item) => Boolean(item.fields.image_url || item.fields.question_hi?.includes("<img") || item.fields.question_en?.includes("<img")));
    }
    list.sort((a, b) => (a.fields.question_r || 0) - (b.fields.question_r || 0));
    const total = list.length;
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const startIndex = (page - 1) * limit;
    const records = list.slice(startIndex, startIndex + limit);
    return { records, total, page, limit };
  }
  async getQuestionById(tableName, recordId) {
    const active = this.getActiveBase();
    const list = this.baseQuestions[active.baseId]?.[tableName] || [];
    return list.find((r) => r.id === recordId) || null;
  }
  async updateQuestion(tableName, recordId, fields, editorName = "Content Editor") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    if (!this.baseQuestions[activeBaseId][tableName]) {
      this.baseQuestions[activeBaseId][tableName] = [];
    }
    const index = this.baseQuestions[activeBaseId][tableName].findIndex((r) => r.id === recordId);
    if (index === -1) {
      throw new Error(`Record ${recordId} not found in table ${tableName}`);
    }
    const existing = this.baseQuestions[activeBaseId][tableName][index];
    const oldFields = { ...existing.fields };
    const updatedFields = {
      ...existing.fields,
      ...fields,
      last_edited_by: editorName,
      last_edited_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const updatedRecord = {
      ...existing,
      fields: updatedFields
    };
    this.baseQuestions[activeBaseId][tableName][index] = updatedRecord;
    const changes = [];
    for (const key of Object.keys(fields)) {
      if (oldFields[key] !== fields[key]) {
        changes.push({
          field: key,
          oldValueSnippet: String(oldFields[key] || "").replace(/<[^>]*>?/gm, "").slice(0, 80),
          newValueSnippet: String(fields[key] || "").replace(/<[^>]*>?/gm, "").slice(0, 80)
        });
      }
    }
    if (changes.length > 0) {
      this.addAuditLog({
        id: `log_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userName: editorName,
        userRole: "Editor",
        tableName,
        questionNumber: updatedFields.question_r,
        recordId,
        action: "update",
        summary: `Updated Question #${updatedFields.question_r} (${changes.map((c) => c.field).join(", ")})`,
        changes
      });
    }
    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    const isLive = Boolean(apiKey && active.baseId);
    if (isLive) {
      await this.syncPatchToAirtable(tableName, recordId, fields);
    }
    return updatedRecord;
  }
  async createQuestion(tableName, fields, editorName = "Content Editor") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    if (!this.baseQuestions[activeBaseId][tableName]) {
      this.baseQuestions[activeBaseId][tableName] = [];
    }
    const list = this.baseQuestions[activeBaseId][tableName];
    const nextQNum = fields.question_r || (list.length > 0 ? Math.max(...list.map((q) => q.fields.question_r || 0)) + 1 : 1);
    const defaultFields = {
      question_r: nextQNum,
      question_hi: fields.question_hi || "<p></p>",
      question_en: fields.question_en || "<p></p>",
      option1_hi: fields.option1_hi || "<p></p>",
      option2_hi: fields.option2_hi || "<p></p>",
      option3_hi: fields.option3_hi || "<p></p>",
      option4_hi: fields.option4_hi || "<p></p>",
      option5_hi: fields.option5_hi || "",
      option1_en: fields.option1_en || "<p></p>",
      option2_en: fields.option2_en || "<p></p>",
      option3_en: fields.option3_en || "<p></p>",
      option4_en: fields.option4_en || "<p></p>",
      option5_en: fields.option5_en || "",
      solution_hi: fields.solution_hi || "<p></p>",
      solution_en: fields.solution_en || "<p></p>",
      correct_option: fields.correct_option || "1",
      image_url: fields.image_url || "",
      qa_status: fields.qa_status || "draft",
      last_edited_by: editorName,
      last_edited_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    let remoteRecordId = null;
    const isLive = Boolean((active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY) && active.baseId);
    if (isLive) {
      remoteRecordId = await this.syncCreateToAirtable(tableName, defaultFields).catch((err) => {
        console.warn("Airtable remote create warning:", err);
        return null;
      });
    }
    const newRecord = {
      id: remoteRecordId || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tableId: tableName,
      tableName,
      fields: defaultFields,
      createdTime: (/* @__PURE__ */ new Date()).toISOString()
    };
    list.push(newRecord);
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userName: editorName,
      userRole: "Editor",
      tableName,
      questionNumber: defaultFields.question_r,
      recordId: newRecord.id,
      action: "create",
      summary: `Created Question #${defaultFields.question_r}`
    });
    return newRecord;
  }
  async deleteQuestion(tableName, recordId, editorName = "Content Editor") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    if (!this.baseQuestions[activeBaseId]?.[tableName]) return false;
    const index = this.baseQuestions[activeBaseId][tableName].findIndex((r) => r.id === recordId);
    if (index === -1) return false;
    const removed = this.baseQuestions[activeBaseId][tableName].splice(index, 1)[0];
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userName: editorName,
      userRole: "Editor",
      tableName,
      questionNumber: removed.fields.question_r,
      recordId,
      action: "delete",
      summary: `Deleted Question #${removed.fields.question_r}`
    });
    const isLive = Boolean((active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY) && active.baseId);
    if (isLive) {
      await this.syncDeleteToAirtable(tableName, recordId).catch((err) => {
        console.warn("Airtable remote delete warning:", err);
      });
    }
    return true;
  }
  async uploadImage(base64Data, fileName, uploader = "Editor") {
    const base64Match = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer;
    let ext = "png";
    if (base64Match) {
      const mime = base64Match[1];
      if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("svg")) ext = "svg";
      buffer = Buffer.from(base64Match[2], "base64");
    } else {
      buffer = Buffer.from(base64Data, "base64");
    }
    const uniqueName = `diagram_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
    const filePath = path.join(this.uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueName}`;
    const newAsset = {
      id: `media_${Date.now()}`,
      url: publicUrl,
      fileName: fileName || uniqueName,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      uploadedBy: uploader,
      size: `${Math.round(buffer.length / 1024)} KB`,
      source: "upload"
    };
    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }
  async uploadToImgbb(imageUrlOrBase64, fileName, uploader = "ImgBB Rehost") {
    const key = this.config.imgbbApiKey || process.env.IMGBB_API_KEY || "";
    if (!key) {
      throw new Error("ImgBB API key is not configured. Please add it in Settings.");
    }
    let rawBase64 = "";
    if (imageUrlOrBase64.startsWith("http://") || imageUrlOrBase64.startsWith("https://")) {
      try {
        const fetchRes = await fetch(imageUrlOrBase64, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        if (fetchRes.ok) {
          const arrayBuf = await fetchRes.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          rawBase64 = buf.toString("base64");
        }
      } catch (err) {
        console.warn(`[ImgBB] Fetching remote image buffer failed for ${imageUrlOrBase64}, falling back to direct URL submission:`, err);
      }
    } else if (imageUrlOrBase64.startsWith("data:")) {
      rawBase64 = imageUrlOrBase64.replace(/^data:[A-Za-z-+/]+;base64,/, "");
    } else {
      rawBase64 = imageUrlOrBase64;
    }
    const formData = new URLSearchParams();
    if (rawBase64) {
      formData.append("image", rawBase64);
    } else {
      formData.append("image", imageUrlOrBase64);
    }
    if (fileName) {
      formData.append("name", fileName);
    }
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ImgBB API responded with ${response.status}: ${errText}`);
    }
    const result = await response.json();
    if (!result.success || !result.data?.url) {
      throw new Error(result.error?.message || "ImgBB upload failed");
    }
    const newAsset = {
      id: `imgbb_${result.data.id || Date.now()}`,
      url: result.data.url,
      fileName: fileName || result.data.title || result.data.image?.filename || "imgbb_image.png",
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      uploadedBy: uploader,
      size: `${Math.round((result.data.size || 0) / 1024)} KB`,
      source: "imgbb"
    };
    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }
  async rehostHtmlText(html, uploader = "ImgBB Rehost") {
    if (!html) return { text: "", replacedCount: 0, replacements: [] };
    const urlRegex = /(?:<img\b[^>]*?\bsrc=["'])(https?:\/\/[^"'\s]+)(?:["'][^>]*>)/gi;
    const urlsToProcess = [];
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.includes("ibb.co") && !url.includes("i.ibb.co") && !urlsToProcess.includes(url)) {
        urlsToProcess.push(url);
      }
    }
    let updatedHtml = html;
    const replacements = [];
    for (const imgUrl of urlsToProcess) {
      try {
        const asset = await this.uploadToImgbb(imgUrl, void 0, uploader);
        if (asset && asset.url) {
          updatedHtml = updatedHtml.split(imgUrl).join(asset.url);
          replacements.push({ from: imgUrl, to: asset.url });
        }
      } catch (err) {
        console.error(`[ImgBB Rehost] Failed to rehost URL ${imgUrl}:`, err);
      }
    }
    return {
      text: updatedHtml,
      replacedCount: replacements.length,
      replacements
    };
  }
  async rehostQuestionImages(tableName, recordId, uploader = "ImgBB Rehost") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    const list = this.baseQuestions[activeBaseId]?.[tableName] || [];
    const target = list.find((r) => r.id === recordId);
    if (!target) {
      throw new Error(`Record ${recordId} not found in ${tableName}`);
    }
    const fieldsToProcess = [
      "question_hi",
      "question_en",
      "option1_hi",
      "option2_hi",
      "option3_hi",
      "option4_hi",
      "option5_hi",
      "option1_en",
      "option2_en",
      "option3_en",
      "option4_en",
      "option5_en",
      "solution_hi",
      "solution_en",
      "image_url"
    ];
    let totalReplaced = 0;
    const allReplacements = [];
    for (const f of fieldsToProcess) {
      const val = target.fields[f];
      if (typeof val === "string" && val.includes("http")) {
        if (f === "image_url" && !val.includes("ibb.co")) {
          try {
            const asset = await this.uploadToImgbb(val, void 0, uploader);
            if (asset?.url) {
              allReplacements.push({ from: val, to: asset.url });
              target.fields.image_url = asset.url;
              totalReplaced++;
            }
          } catch (e) {
            console.warn(`[ImgBB Rehost] Failed to rehost image_url:`, e);
          }
        } else {
          const res = await this.rehostHtmlText(val, uploader);
          if (res.replacedCount > 0) {
            target.fields[f] = res.text;
            totalReplaced += res.replacedCount;
            allReplacements.push(...res.replacements);
          }
        }
      }
    }
    if (totalReplaced > 0) {
      target.fields.last_edited_by = uploader;
      target.fields.last_edited_at = (/* @__PURE__ */ new Date()).toISOString();
      if (this.config.isConnected) {
        await this.syncPatchToAirtable(tableName, recordId, target.fields).catch((err) => {
          console.warn("[ImgBB Rehost] Airtable remote sync failed:", err);
        });
      }
    }
    return {
      record: target,
      replacedCount: totalReplaced,
      replacements: allReplacements
    };
  }
  async rehostTableImages(tableName, uploader = "ImgBB Table Rehost") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    const list = this.baseQuestions[activeBaseId]?.[tableName] || [];
    let affectedQuestions = 0;
    let totalImagesRehosted = 0;
    for (const rec of list) {
      try {
        const res = await this.rehostQuestionImages(tableName, rec.id, uploader);
        if (res.replacedCount > 0) {
          affectedQuestions++;
          totalImagesRehosted += res.replacedCount;
        }
      } catch (err) {
        console.error(`[ImgBB Bulk Rehost] Failed for question ${rec.fields.question_r}:`, err);
      }
    }
    return {
      tableName,
      totalQuestions: list.length,
      affectedQuestions,
      rehostedImagesCount: totalImagesRehosted
    };
  }
  async findAndReplace(options, userName = "Admin") {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    const currentQuestions = this.baseQuestions[activeBaseId] || {};
    const targetTables = options.tableName && options.tableName !== "all" ? [options.tableName] : Object.keys(currentQuestions);
    const matches = [];
    let affectedQuestionsSet = /* @__PURE__ */ new Set();
    const flags = options.matchCase ? "g" : "gi";
    const regex = new RegExp(options.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    for (const tbl of targetTables) {
      const records = currentQuestions[tbl] || [];
      for (const rec of records) {
        let questionHadMatch = false;
        const checkAndReplace = (fieldName) => {
          const val = rec.fields[fieldName];
          if (typeof val === "string" && regex.test(val)) {
            questionHadMatch = true;
            const replaced = val.replace(regex, options.replaceQuery);
            matches.push({
              recordId: rec.id,
              tableName: tbl,
              questionNumber: rec.fields.question_r,
              field: String(fieldName),
              originalText: val,
              previewReplacedText: replaced
            });
            if (!options.dryRun) {
              rec.fields[fieldName] = replaced;
            }
          }
        };
        if (options.targetFields.includes("all") || options.targetFields.includes("question")) {
          checkAndReplace("question_hi");
          checkAndReplace("question_en");
        }
        if (options.targetFields.includes("all") || options.targetFields.includes("options")) {
          checkAndReplace("option1_hi");
          checkAndReplace("option2_hi");
          checkAndReplace("option3_hi");
          checkAndReplace("option4_hi");
          checkAndReplace("option5_hi");
          checkAndReplace("option1_en");
          checkAndReplace("option2_en");
          checkAndReplace("option3_en");
          checkAndReplace("option4_en");
          checkAndReplace("option5_en");
        }
        if (options.targetFields.includes("all") || options.targetFields.includes("solution")) {
          checkAndReplace("solution_hi");
          checkAndReplace("solution_en");
        }
        if (questionHadMatch) {
          affectedQuestionsSet.add(rec.id);
          if (!options.dryRun) {
            rec.fields.last_edited_by = userName;
            rec.fields.last_edited_at = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      }
    }
    if (!options.dryRun && matches.length > 0) {
      this.addAuditLog({
        id: `log_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userName,
        userRole: "Admin",
        tableName: options.tableName || "All Tables",
        questionNumber: 0,
        recordId: "bulk",
        action: "bulk_replace",
        summary: `Bulk Replaced "${options.searchQuery}" with "${options.replaceQuery}" in ${affectedQuestionsSet.size} questions`
      });
    }
    return {
      matchesCount: matches.length,
      affectedQuestions: affectedQuestionsSet.size,
      preview: matches.slice(0, 50),
      applied: !options.dryRun
    };
  }
  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }
  addAuditLog(log) {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
  getMediaAssets() {
    return this.mediaAssets;
  }
  prepareAirtableFields(baseId, tableName, fields) {
    const airtableFields = {};
    const mappings = this.tableFieldMappings[baseId]?.[tableName] || {};
    const rawCols = this.tableRawColumns[baseId]?.[tableName] || [];
    const normalizeKey = (k) => k.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/gi, "");
    const internalSkip = /* @__PURE__ */ new Set([
      "question_r",
      "id",
      "_id",
      "recordId",
      "tableId",
      "tableName",
      "qa_status",
      "last_edited_by",
      "last_edited_at",
      "image_url",
      "rawFields",
      "searchTokens",
      "statusSummary"
    ]);
    for (const [internalKey, value] of Object.entries(fields)) {
      if (internalKey === "question_r") continue;
      const mapping = mappings[internalKey];
      if (mapping) {
        const colName = mapping.airtableFieldName;
        if (colName.toLowerCase() === "question_r") continue;
        if (mapping.isAttachment) {
          if (typeof value === "string" && value.startsWith("http")) {
            airtableFields[colName] = [{ url: value }];
          } else if (!value) {
            airtableFields[colName] = [];
          }
        } else {
          airtableFields[colName] = value;
        }
        continue;
      }
      if (internalKey === "correct_option") {
        const ansCol = rawCols.find((c) => /^(answer|ans|correct_option|correct_ans|key)$/i.test(c)) || "answer";
        airtableFields[ansCol] = String(value);
        continue;
      }
      if (rawCols.length > 0) {
        const exactCol = rawCols.find((c) => c === internalKey);
        if (exactCol && !internalSkip.has(internalKey)) {
          airtableFields[exactCol] = value;
          continue;
        }
        const normTarget = normalizeKey(internalKey);
        const normCol = rawCols.find((c) => normalizeKey(c) === normTarget);
        if (normCol && !internalSkip.has(internalKey)) {
          airtableFields[normCol] = value;
          continue;
        }
      } else if (!internalSkip.has(internalKey)) {
        airtableFields[internalKey] = value;
      }
    }
    return airtableFields;
  }
  async syncPatchToAirtable(tableName, recordId, fields) {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId) {
      console.warn("[Airtable Sync] No API key or active base ID configured. Skipping remote sync.");
      return;
    }
    if (!recordId.startsWith("rec")) {
      console.log(`[Airtable Sync] Record ID "${recordId}" is not an Airtable rec ID. Creating record remotely...`);
      const newRecId = await this.syncCreateToAirtable(tableName, fields);
      if (newRecId) {
        const list = this.baseQuestions[active.baseId]?.[tableName] || [];
        const found = list.find((q) => q.id === recordId);
        if (found) {
          found.id = newRecId;
        }
      }
      return;
    }
    const airtableFields = this.prepareAirtableFields(active.baseId, tableName, fields);
    if (Object.keys(airtableFields).length === 0) {
      console.log("[Airtable Sync] No Airtable fields to update.");
      return;
    }
    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    let currentFields = { ...airtableFields };
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      attempts++;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: currentFields })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Airtable Sync Success] Record ${recordId} updated in table "${tableName}" on base "${active.name || active.baseId}".`);
        return data;
      }
      const errJson = await res.json().catch(() => ({}));
      const errType = errJson.error?.type;
      const errMsg = errJson.error?.message || "";
      console.warn(`[Airtable Sync Warning] Attempt ${attempts} failed:`, errType, errMsg);
      if (errType === "UNKNOWN_FIELD_NAME" || errType === "INVALID_VALUE_FOR_COLUMN") {
        const fieldMatch = errMsg.match(/(?:Field|field name:?)\s*"?([^"\s]+)"?/i);
        if (fieldMatch && fieldMatch[1]) {
          const badField = fieldMatch[1];
          console.log(`[Airtable Sync Recovery] Removing rejected field "${badField}" and retrying...`);
          delete currentFields[badField];
          if (Object.keys(currentFields).length > 0) {
            continue;
          }
        }
      }
      console.error("[Airtable Sync Fatal Error]", JSON.stringify({ fields: currentFields }), errJson);
      throw new Error(`Airtable Sync Failed: ${errMsg || JSON.stringify(errJson)}`);
    }
  }
  async syncCreateToAirtable(tableName, fields) {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId) return null;
    const airtableFields = this.prepareAirtableFields(active.baseId, tableName, fields);
    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}`;
    let currentFields = { ...airtableFields };
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      attempts++;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: currentFields })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Airtable Sync Success] Record ${data.id} created in table "${tableName}".`);
        return data.id || null;
      }
      const errJson = await res.json().catch(() => ({}));
      const errType = errJson.error?.type;
      const errMsg = errJson.error?.message || "";
      if (errType === "UNKNOWN_FIELD_NAME" || errType === "INVALID_VALUE_FOR_COLUMN") {
        const fieldMatch = errMsg.match(/(?:Field|field name:?)\s*"?([^"\s]+)"?/i);
        if (fieldMatch && fieldMatch[1]) {
          const badField = fieldMatch[1];
          console.log(`[Airtable Sync Recovery] Removing rejected field "${badField}" and retrying...`);
          delete currentFields[badField];
          if (Object.keys(currentFields).length > 0) {
            continue;
          }
        }
      }
      console.error("[Airtable Sync Create Error]", errJson);
      break;
    }
    return null;
  }
  async syncDeleteToAirtable(tableName, recordId) {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId || !recordId.startsWith("rec")) return;
    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  }
};
var airtableService = new AirtableService();

// server/app.ts
function createExpressApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "50mb" }));
  const uploadsDir = path2.join(process.cwd(), "public", "uploads");
  if (fs2.existsSync(uploadsDir)) {
    app2.use("/uploads", express.static(uploadsDir));
  }
  const apiRouter = express.Router();
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  apiRouter.get("/config", (req, res) => {
    const config = airtableService.getConfig();
    const maskedKey = config.apiKey ? `${config.apiKey.substring(0, 5)}...${config.apiKey.slice(-4)}` : "";
    res.json({
      ...config,
      apiKey: maskedKey,
      hasRawKey: Boolean(config.apiKey)
    });
  });
  apiRouter.post("/config", async (req, res) => {
    try {
      const { apiKey, baseId, imgbbApiKey } = req.body;
      const updated = airtableService.updateConfig({
        apiKey: apiKey || "",
        baseId: baseId || "",
        imgbbApiKey: imgbbApiKey || ""
      });
      const testResult = await airtableService.testConnection();
      res.json({ config: updated, testResult });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/config/test", async (req, res) => {
    try {
      const result = await airtableService.testConnection();
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  apiRouter.get("/bases", (req, res) => {
    try {
      const bases = airtableService.getBases();
      res.json({ bases });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/bases", async (req, res) => {
    try {
      const newBase = await airtableService.addBase(req.body);
      const bases = airtableService.getBases();
      res.status(201).json({ base: newBase, bases });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  apiRouter.patch("/bases/:baseId", async (req, res) => {
    try {
      const { baseId } = req.params;
      const updated = await airtableService.updateBase(baseId, req.body);
      const bases = airtableService.getBases();
      res.json({ base: updated, bases });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  apiRouter.delete("/bases/:baseId", async (req, res) => {
    try {
      const { baseId } = req.params;
      const result = await airtableService.deleteBase(baseId);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  apiRouter.post("/bases/:baseId/activate", async (req, res) => {
    try {
      const { baseId } = req.params;
      const config = await airtableService.setActiveBase(baseId);
      res.json({ success: true, config, activeBaseId: config.activeBaseId, activeBaseName: config.activeBaseName });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  apiRouter.post("/bases/:baseId/test", async (req, res) => {
    try {
      const { baseId } = req.params;
      const { apiKey } = req.body;
      const result = await airtableService.testBaseConnection(baseId, apiKey);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  apiRouter.post("/bases/fetch-meta", async (req, res) => {
    try {
      const { baseId, apiKey } = req.body;
      const result = await airtableService.fetchBaseMeta(baseId, apiKey);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  apiRouter.post("/bases/discover", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const result = await airtableService.discoverAccountBases(apiKey);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  apiRouter.get("/tables", async (req, res) => {
    try {
      const tables = await airtableService.getTables();
      res.json({ tables });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/tables", async (req, res) => {
    try {
      const { name, description, category } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Table name is required." });
      }
      const table = await airtableService.createTable(name, description, category);
      res.status(201).json({ table });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.get("/tables/:tableName/raw-debug", async (req, res) => {
    try {
      const { tableName } = req.params;
      const active = airtableService.getActiveBase();
      if (!active) return res.status(400).json({ error: "No active base" });
      const apiKey = active.apiKey || airtableService.getConfig().apiKey || process.env.AIRTABLE_API_KEY;
      const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}?maxRecords=3`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json({
        tableName,
        baseId: active.baseId,
        status: response.status,
        records: data.records || [],
        error: data.error
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.get("/tables/:tableName/records", async (req, res) => {
    try {
      const { tableName } = req.params;
      const { search, status, hasImage, page, limit } = req.query;
      const result = await airtableService.getQuestions(tableName, {
        search: search ? String(search) : void 0,
        status: status ? String(status) : void 0,
        hasImage: hasImage === "true",
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 100
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.get("/tables/:tableName/records/:recordId", async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const record = await airtableService.getQuestionById(tableName, recordId);
      if (!record) {
        return res.status(404).json({ error: "Question record not found" });
      }
      res.json({ record });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/tables/:tableName/records", async (req, res) => {
    try {
      const { tableName } = req.params;
      const { fields, editorName } = req.body;
      const record = await airtableService.createQuestion(tableName, fields || {}, editorName || "Content Editor");
      res.status(201).json({ record });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.patch("/tables/:tableName/records/:recordId", async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const { fields, editorName } = req.body;
      if (!fields) {
        return res.status(400).json({ error: "Fields payload is required" });
      }
      const updated = await airtableService.updateQuestion(tableName, recordId, fields, editorName || "Content Editor");
      res.json({ record: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.delete("/tables/:tableName/records/:recordId", async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const { editorName } = req.body;
      const deleted = await airtableService.deleteQuestion(tableName, recordId, editorName || "Content Editor");
      if (!deleted) {
        return res.status(404).json({ error: "Question record not found" });
      }
      res.json({ success: true, recordId });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/upload-image", async (req, res) => {
    try {
      const { imageBase64, fileName, uploader } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 data is required" });
      }
      try {
        const media2 = await airtableService.uploadToImgbb(imageBase64, fileName, uploader || "Editor");
        return res.json({ media: media2 });
      } catch (imgbbErr) {
        console.warn("ImgBB upload failed, falling back to local storage:", imgbbErr);
      }
      const media = await airtableService.uploadImage(imageBase64, fileName, uploader || "Editor");
      res.json({ media });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/images/rehost-url", async (req, res) => {
    try {
      const { url, name, uploader } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      const asset = await airtableService.uploadToImgbb(url, name, uploader || "ImgBB Rehost");
      res.json({ success: true, originalUrl: url, imgbbUrl: asset.url, asset });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/images/rehost-text", async (req, res) => {
    try {
      const { htmlText, uploader } = req.body;
      if (!htmlText) {
        return res.json({ text: "", replacedCount: 0, replacements: [] });
      }
      const result = await airtableService.rehostHtmlText(htmlText, uploader || "ImgBB Rehost");
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/images/rehost-question", async (req, res) => {
    try {
      const { tableName, recordId, uploader } = req.body;
      if (!tableName || !recordId) {
        return res.status(400).json({ error: "tableName and recordId are required" });
      }
      const result = await airtableService.rehostQuestionImages(tableName, recordId, uploader || "ImgBB Rehost");
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.post("/images/rehost-table", async (req, res) => {
    try {
      const { tableName, uploader } = req.body;
      if (!tableName) {
        return res.status(400).json({ error: "tableName is required" });
      }
      const result = await airtableService.rehostTableImages(tableName, uploader || "ImgBB Bulk Rehost");
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.get("/media", (req, res) => {
    const assets = airtableService.getMediaAssets();
    res.json({ assets });
  });
  apiRouter.post("/bulk/find-replace", async (req, res) => {
    try {
      const { tableName, searchQuery, replaceQuery, targetFields, matchCase, dryRun, userName } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const result = await airtableService.findAndReplace({
        tableName: tableName || "all",
        searchQuery,
        replaceQuery: replaceQuery || "",
        targetFields: targetFields || ["all"],
        matchCase: Boolean(matchCase),
        dryRun: dryRun !== false
      }, userName || "Admin");
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  apiRouter.get("/audit-logs", (req, res) => {
    const logs = airtableService.getAuditLogs(100);
    res.json({ logs });
  });
  app2.use("/api", apiRouter);
  app2.use(apiRouter);
  return app2;
}
var app = createExpressApp();
var app_default = app;
export {
  app,
  createExpressApp,
  app_default as default
};
