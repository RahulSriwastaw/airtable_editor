import { TableMeta, QuestionRecord, AuditLog, MediaAsset } from '../src/types';

export const INITIAL_TABLES: TableMeta[] = [
  {
    id: 'tbl_bp_08',
    name: 'Bihar Police MockTest-08',
    description: 'Bihar Police Constable Full Length Mock Test 08 (Hindi & English Bilingual)',
    category: 'Bihar Police',
    recordCount: 25,
    lastModified: '2026-08-27T10:30:00.000Z',
    statusSummary: { draft: 4, inReview: 6, approved: 15 },
    hasImagesCount: 4,
  },
  {
    id: 'tbl_bsi_01',
    name: 'Bihar SI MockTest-01',
    description: 'Bihar Sub-Inspector Prelims Exam Paper-1 Mock Test',
    category: 'Bihar SI',
    recordCount: 20,
    lastModified: '2026-08-26T18:45:00.000Z',
    statusSummary: { draft: 2, inReview: 5, approved: 13 },
    hasImagesCount: 3,
  },
  {
    id: 'tbl_bpsc_17',
    name: '72nd BPSC CCE 2026 Full Test-17',
    description: '72nd Combined Competitive Examination Prelims GS Paper Mock Test',
    category: 'BPSC',
    recordCount: 30,
    lastModified: '2026-08-27T09:15:00.000Z',
    statusSummary: { draft: 6, inReview: 8, approved: 16 },
    hasImagesCount: 5,
  },
  {
    id: 'tbl_rly_05',
    name: 'Railway NTPC MockTest-05',
    description: 'RRB NTPC CBT-1 General Awareness & General Science Sectional Test',
    category: 'SSC/Railway',
    recordCount: 15,
    lastModified: '2026-08-25T14:20:00.000Z',
    statusSummary: { draft: 1, inReview: 3, approved: 11 },
    hasImagesCount: 2,
  },
  {
    id: 'tbl_bp_09',
    name: 'Bihar Police MockTest-09',
    description: 'Bihar Police Constable Practice Set 09 with Current Affairs',
    category: 'Bihar Police',
    recordCount: 18,
    lastModified: '2026-08-24T11:00:00.000Z',
    statusSummary: { draft: 5, inReview: 4, approved: 9 },
    hasImagesCount: 1,
  }
];

export const INITIAL_QUESTIONS: Record<string, QuestionRecord[]> = {
  'Bihar Police MockTest-08': [
    {
      id: 'rec_bp08_001',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 1,
        question_hi: '<p><strong>राष्ट्रीय मखाना अनुसंधान केंद्र</strong> (National Research Centre for Makhana) बिहार के किस जिले में स्थित है?</p>',
        question_en: '<p>In which district of Bihar is the <strong>National Research Centre for Makhana</strong> located?</p>',
        option1_hi: '<p>दरभंगा (Darbhanga)</p>',
        option2_hi: '<p>मधुबनी (Madhubani)</p>',
        option3_hi: '<p>समस्तीपुर (Samastipur)</p>',
        option4_hi: '<p>मुजफ्फरपुर (Muzaffarpur)</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>',
        option1_en: '<p>Darbhanga</p>',
        option2_en: '<p>Madhubani</p>',
        option3_en: '<p>Samastipur</p>',
        option4_en: '<p>Muzaffarpur</p>',
        option5_en: '<p>None of the above / More than one</p>',
        solution_hi: '<p>सही उत्तर: <strong>(1) दरभंगा</strong></p><p>राष्ट्रीय मखाना अनुसंधान केंद्र भारतीय कृषि अनुसंधान परिषद (ICAR) के तहत <strong>दरभंगा</strong>, बिहार में स्थापित है। बिहार देश के कुल मखाना उत्पादन का 85% से अधिक उत्पादन करता है।</p>',
        solution_en: '<p>Correct Answer: <strong>(1) Darbhanga</strong></p><p>The National Research Centre for Makhana is situated in <strong>Darbhanga</strong>, Bihar under ICAR. Bihar accounts for over 85% of total makhana production in India.</p>',
        correct_option: '1',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-27T10:15:00.000Z'
      }
    },
    {
      id: 'rec_bp08_002',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 2,
        question_hi: '<p>निम्नलिखित में से कौन सा <strong>मौलिक अधिकार</strong> केवल भारतीय नागरिकों को प्राप्त है, विदेशियों को नहीं?</p>',
        question_en: '<p>Which of the following <strong>Fundamental Rights</strong> is available only to Indian citizens and not to foreigners?</p>',
        option1_hi: '<p>अनुच्छेद 14 (विधि के समक्ष समानता)</p>',
        option2_hi: '<p>अनुच्छेद 19 (वाक् एवं अभिव्यक्ति की स्वतंत्रता)</p>',
        option3_hi: '<p>अनुच्छेद 21 (प्राण एवं दैहिक स्वतंत्रता)</p>',
        option4_hi: '<p>अनुच्छेद 25 (धर्म को मानने की स्वतंत्रता)</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं</p>',
        option1_en: '<p>Article 14 (Equality before Law)</p>',
        option2_en: '<p>Article 19 (Freedom of speech and expression)</p>',
        option3_en: '<p>Article 21 (Protection of life and personal liberty)</p>',
        option4_en: '<p>Article 25 (Freedom of religion)</p>',
        option5_en: '<p>None of the above</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) अनुच्छेद 19</strong></p><p>भारतीय संविधान के अनुच्छेद 15, 16, 19, 29 और 30 केवल भारतीय नागरिकों को प्राप्त हैं। अनुच्छेद 14, 20, 21, 21A, 22, 23, 24, 25, 26, 27 और 28 नागरिकों एवं विदेशियों दोनों को प्राप्त हैं।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) Article 19</strong></p><p>Articles 15, 16, 19, 29, and 30 are available exclusively to Indian citizens. Articles 14, 20, 21, etc. are available to both citizens and foreigners.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Pooja Verma',
        last_edited_at: '2026-08-27T08:30:00.000Z'
      }
    },
    {
      id: 'rec_bp08_003',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 3,
        question_hi: '<p>दिए गए परिपथ आरेख (Circuit Diagram) में <strong>तुल्य प्रतिरोध (Equivalent Resistance)</strong> की गणना करें:</p>',
        question_en: '<p>Calculate the <strong>equivalent resistance</strong> in the given circuit diagram:</p>',
        option1_hi: '<p>4 Ω</p>',
        option2_hi: '<p>6 Ω</p>',
        option3_hi: '<p>8 Ω</p>',
        option4_hi: '<p>12 Ω</p>',
        option5_hi: '<p>16 Ω</p>',
        option1_en: '<p>4 Ω</p>',
        option2_en: '<p>6 Ω</p>',
        option3_en: '<p>8 Ω</p>',
        option4_en: '<p>12 Ω</p>',
        option5_en: '<p>16 Ω</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) 6 Ω</strong></p><p>समानांतर क्रम में जुड़े दो 12 Ω प्रतिरोधकों का मान: <em>R<sub>p</sub> = (12 × 12) / (12 + 12) = 6 Ω</em> होता है।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) 6 Ω</strong></p><p>Two 12 Ω resistors connected in parallel give: <em>R<sub>p</sub> = (12 × 12) / (12 + 12) = 6 Ω</em>.</p>',
        correct_option: '2',
        image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
        qa_status: 'in_review',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-26T16:20:00.000Z'
      }
    },
    {
      id: 'rec_bp08_004',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 4,
        question_hi: '<p>बिहार में <strong>1857 के विद्रोह</strong> का नेतृत्व जगदीशपुर से किसने किया था?</p>',
        question_en: '<p>Who led the <strong>Revolt of 1857</strong> in Bihar from Jagdishpur?</p>',
        option1_hi: '<p>पीर अली खान</p>',
        option2_hi: '<p>कुंवर सिंह</p>',
        option3_hi: '<p>अमर सिंह</p>',
        option4_hi: '<p>हरे कृष्ण सिंह</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं</p>',
        option1_en: '<p>Peer Ali Khan</p>',
        option2_en: '<p>Kunwar Singh</p>',
        option3_en: '<p>Amar Singh</p>',
        option4_en: '<p>Hare Krishna Singh</p>',
        option5_en: '<p>None of the above</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) कुंवर सिंह</strong></p><p>वीर कुंवर सिंह ने 80 वर्ष की उम्र में जगदीशपुर (आरा, बिहार) से 1857 के स्वतंत्रता संग्राम का ऐतिहासिक नेतृत्व किया था।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) Kunwar Singh</strong></p><p>Veer Kunwar Singh led the Revolt of 1857 from Jagdishpur, Arrah at the age of nearly 80 years.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-25T11:40:00.000Z'
      }
    },
    {
      id: 'rec_bp08_005',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 5,
        question_hi: '<p>प्रकाश संश्लेषण (Photosynthesis) के दौरान निकलने वाली <strong>ऑक्सीजन गैस</strong> किस अणु के विखंडन से प्राप्त होती है?</p>',
        question_en: '<p>During photosynthesis, the released <strong>oxygen gas</strong> is derived from the splitting of which molecule?</p>',
        option1_hi: '<p>कार्बन डाइऑक्साइड (CO<sub>2</sub>)</p>',
        option2_hi: '<p>जल (H<sub>2</sub>O)</p>',
        option3_hi: '<p>ग्लूकोज (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>)</p>',
        option4_hi: '<p>क्लोरोफिल (Chlorophyll)</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं</p>',
        option1_en: '<p>Carbon dioxide (CO<sub>2</sub>)</p>',
        option2_en: '<p>Water (H<sub>2</sub>O)</p>',
        option3_en: '<p>Glucose (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>)</p>',
        option4_en: '<p>Chlorophyll</p>',
        option5_en: '<p>None of the above</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) जल (H<sub>2</sub>O)</strong></p><p>प्रकाश अभिक्रिया (Light reaction) में थाइलाकोइड झिल्ली में जल के फोटोलाइसिस (विखंडन) से ऑक्सीजन मुक्त होती है।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) Water (H<sub>2</sub>O)</strong></p><p>Oxygen released during photosynthesis comes from photolysis of water molecules in the thylakoids.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'draft',
        last_edited_by: 'Pooja Verma',
        last_edited_at: '2026-08-27T09:50:00.000Z'
      }
    },
    {
      id: 'rec_bp08_006',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 6,
        question_hi: '<p>Calcium fluoride (CaF<sub>2</sub>) की electrical neutrality का सही कारण क्या है?</p>',
        question_en: '<p>What is the correct reason for the electrical neutrality of Calcium fluoride (CaF<sub>2</sub>)?</p>',
        option1_hi: '<p>एक Ca<sup>2+</sup> ion और दो F<sup>-</sup> ions के कुल charges</p>',
        option2_hi: '<p>Calcium का charge +1 और fluorine का charge 0 होता है</p>',
        option3_hi: '<p>Compound का net charge +2 होता है</p>',
        option4_hi: '<p>Fluoride ions हमेशा +1 charge रखते हैं</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>',
        option1_en: '<p>Total charges of one Ca<sup>2+</sup> ion and two F<sup>-</sup> ions cancel out</p>',
        option2_en: '<p>Calcium has +1 charge and fluorine has 0 charge</p>',
        option3_en: '<p>The net charge of the compound is +2</p>',
        option4_en: '<p>Fluoride ions always carry +1 charge</p>',
        option5_en: '<p>None of the above / More than one</p>',
        solution_hi: '<p>सही उत्तर: <strong>(1) एक Ca<sup>2+</sup> ion और दो F<sup>-</sup> ions के कुल charges</strong></p><p>कैल्शियम फ्लोराइड (CaF<sub>2</sub>) में प्रत्येक Calcium आयन (Ca<sup>2+</sup>) पर +2 आवेश होता है और दो Fluoride आयनों (2 × F<sup>-</sup>) पर कुल -2 आवेश होता है। इस प्रकार कुल शुद्ध आवेश (Net charge) = (+2) + (-2) = 0 होता है, जिससे यौगिक विद्युत रूप से उदासीन (Electrically Neutral) रहता है।</p>',
        solution_en: '<p>Correct Answer: <strong>(1) Total charges of one Ca<sup>2+</sup> ion and two F<sup>-</sup> ions cancel out</strong></p><p>In Calcium fluoride (CaF<sub>2</sub>), one calcium cation carries a +2 charge (Ca<sup>2+</sup>) and two fluoride anions carry -1 charge each (2 × F<sup>-</sup> = -2). The total charge is (+2) + (-2) = 0, making the crystal lattice electrically neutral.</p>',
        correct_option: '1',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-27T12:30:00.000Z'
      }
    },
    {
      id: 'rec_bp08_007',
      tableId: 'tbl_bp_08',
      tableName: 'Bihar Police MockTest-08',
      fields: {
        question_r: 7,
        question_hi: '<p>यदि sin θ + cos θ = √2 और θ न्यून कोण (Acute angle) है, तो θ का मान कितना होगा?</p>',
        question_en: '<p>If sin θ + cos θ = √2 and θ is an acute angle, then what is the value of θ?</p>',
        option1_hi: '<p>30°</p>',
        option2_hi: '<p>45°</p>',
        option3_hi: '<p>60°</p>',
        option4_hi: '<p>75°</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>',
        option1_en: '<p>30°</p>',
        option2_en: '<p>45°</p>',
        option3_en: '<p>60°</p>',
        option4_en: '<p>75°</p>',
        option5_en: '<p>None of the above / More than one</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) 45°</strong></p><p>(sin θ + cos θ) का अधिकतम मान √2 होता है और यह तब प्राप्त होता है जब sin θ = cos θ = 1/√2 होता है। इसलिए θ = 45°।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) 45°</strong></p><p>The maximum value of (sin θ + cos θ) is √2, which occurs when sin θ = cos θ = 1/√2. Therefore, θ = 45°.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-30T09:15:00.000Z'
      }
    }
  ],
  'Bihar SI MockTest-01': [
    {
      id: 'rec_bsi01_001',
      tableId: 'tbl_bsi_01',
      tableName: 'Bihar SI MockTest-01',
      fields: {
        question_r: 1,
        question_hi: '<p>भारत में <strong>पंचायती राज व्यवस्था</strong> की संस्तुति किस समिति द्वारा 1957 में की गई थी?</p>',
        question_en: '<p>Which committee recommended the establishment of <strong>Panchayati Raj System</strong> in India in 1957?</p>',
        option1_hi: '<p>अशोक मेहता समिति</p>',
        option2_hi: '<p>बलवंत राय मेहता समिति</p>',
        option3_hi: '<p>एल. एम. सिंघवी समिति</p>',
        option4_hi: '<p>जी. वी. के. राव समिति</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं</p>',
        option1_en: '<p>Ashok Mehta Committee</p>',
        option2_en: '<p>Balwant Rai Mehta Committee</p>',
        option3_en: '<p>L. M. Singhvi Committee</p>',
        option4_en: '<p>G. V. K. Rao Committee</p>',
        option5_en: '<p>None of the above</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) बलवंत राय मेहता समिति</strong></p><p>बलवंत राय मेहता समिति ने 1957 में त्रि-स्तरीय पंचायती राज व्यवस्था (ग्राम, ब्लॉक एवं जिला स्तर) की सिफारिश की थी।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) Balwant Rai Mehta Committee</strong></p><p>The Balwant Rai Mehta Committee submitted its report in 1957 recommending a 3-tier Panchayati Raj system.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-26T14:10:00.000Z'
      }
    }
  ],
  '72nd BPSC CCE 2026 Full Test-17': [
    {
      id: 'rec_bpsc17_001',
      tableId: 'tbl_bpsc_17',
      tableName: '72nd BPSC CCE 2026 Full Test-17',
      fields: {
        question_r: 1,
        question_hi: '<p>मौर्य काल में <strong>"सीताध्यक्ष"</strong> (Sitadhyaksha) किस विभाग का प्रमुख अधिकारी होता था?</p>',
        question_en: '<p>During the Mauryan period, the <strong>"Sitadhyaksha"</strong> was the superintendent of which department?</p>',
        option1_hi: '<p>शाही टकसाल (Royal Mint)</p>',
        option2_hi: '<p>कृषि विभाग (Crown Agricultural Lands)</p>',
        option3_hi: '<p>सीमा शुल्क एवं कर (Customs & Tolls)</p>',
        option4_hi: '<p>वन संपदा (Forest produce)</p>',
        option5_hi: '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>',
        option1_en: '<p>Royal Mint</p>',
        option2_en: '<p>Crown Agricultural Lands</p>',
        option3_en: '<p>Customs & Tolls</p>',
        option4_en: '<p>Forest Produce</p>',
        option5_en: '<p>None of the above / More than one</p>',
        solution_hi: '<p>सही उत्तर: <strong>(2) कृषि विभाग</strong></p><p>कौटिल्य के अर्थशास्त्र के अनुसार सीताध्यक्ष सरकारी कृषि भूमि एवं खेती की देखरेख का मुख्य प्रभारी होता था।</p>',
        solution_en: '<p>Correct Answer: <strong>(2) Crown Agricultural Lands</strong></p><p>According to Kautilya\'s Arthashastra, Sitadhyaksha was the superintendent of agriculture and crown lands.</p>',
        correct_option: '2',
        image_url: '',
        qa_status: 'approved',
        last_edited_by: 'Sunil Kumar',
        last_edited_at: '2026-08-27T09:10:00.000Z'
      }
    }
  ]
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: '2026-08-27T10:15:00.000Z',
    userName: 'Sunil Kumar',
    userRole: 'Content Editor',
    tableName: 'Bihar Police MockTest-08',
    questionNumber: 1,
    recordId: 'rec_bp08_001',
    action: 'update',
    summary: 'Updated Hindi solution and bold tags for Darbhanga district',
    changes: [
      { field: 'solution_hi', oldValueSnippet: 'दरभंगा में स्थित है।', newValueSnippet: '<strong>दरभंगा</strong>, बिहार में स्थापित है।' }
    ]
  },
  {
    id: 'log_002',
    timestamp: '2026-08-27T08:30:00.000Z',
    userName: 'Pooja Verma',
    userRole: 'QA Reviewer',
    tableName: 'Bihar Police MockTest-08',
    questionNumber: 2,
    recordId: 'rec_bp08_002',
    action: 'update',
    summary: 'Marked QA Status as Approved & verified Article 19 explanation',
    changes: [
      { field: 'qa_status', oldValueSnippet: 'in_review', newValueSnippet: 'approved' }
    ]
  },
  {
    id: 'log_003',
    timestamp: '2026-08-26T16:20:00.000Z',
    userName: 'Sunil Kumar',
    userRole: 'Content Editor',
    tableName: 'Bihar Police MockTest-08',
    questionNumber: 3,
    recordId: 'rec_bp08_003',
    action: 'update',
    summary: 'Attached circuit diagram image via direct clipboard paste',
    changes: [
      { field: 'image_url', oldValueSnippet: '', newValueSnippet: 'https://images.unsplash.com/...' }
    ]
  }
];

export const INITIAL_MEDIA: MediaAsset[] = [
  {
    id: 'media_001',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    fileName: 'circuit_resistors_parallel.png',
    uploadedAt: '2026-08-26T16:19:00.000Z',
    uploadedBy: 'Sunil Kumar',
    size: '142 KB',
    dimensions: '640x360',
    source: 'paste'
  },
  {
    id: 'media_002',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    fileName: 'photosynthesis_light_reaction.png',
    uploadedAt: '2026-08-25T11:20:00.000Z',
    uploadedBy: 'Pooja Verma',
    size: '215 KB',
    dimensions: '800x450',
    source: 'upload'
  }
];
