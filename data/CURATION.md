# Atlas curation notes

The timeline is a chronological research index. It does not assert that heritage interpretation has three established theoretical streams. The previous A/B/C stream values remain in the JSON only for compatibility with older exports; the public interface does not use them.

Dot colour denotes document type. Dot size uses `importance` as a **provisional researcher code** for contribution to heritage interpretation: 1 = contextual reference, 2 = field-shaping framework, 3 = direct theoretical or interpretive shift. These levels are qualitative working judgments, not citation counts or measurements of objective impact. `importance_note` records a short rationale. `placeholder: true` produces a dashed ring and means close reading and analytical coding are pending.

Source excerpts are stored as short verbatim quotations in `excerpts`, with `source` and `location`. Only excerpts checked against accessible original or publisher texts have been added. A missing excerpt is displayed honestly as pending; summaries and previews are paraphrases, not quotations.

- ICOMOS Interpretation Charter, 2008, Principle 2.3: https://www.icomos.org/images/DOCUMENTS/Charters/interpretation_e_1.pdf
- The London Charter, version 2.1, February 2009, Principle 2: https://londoncharter.org/principles.html ; version history: https://londoncharter.org/history.html
- UNESCO Charter on the Preservation of Digital Heritage, 2003, Article 2: https://www.unesco.org/en/legal-affairs/charter-preservation-digital-heritage
- ICOMOS Delhi Declaration on Heritage and Democracy, 2017, sections 2–3: https://www.icomos.org/images/DOCUMENTS/Charters/GA2017_Delhi-Declaration_20180117_EN.pdf
- Milgram & Kishino, 1994, publisher abstract: https://globals.ieice.org/en_transactions/information/10.1587/e77-d_12_1321/_p

The UNESCO digital-heritage charter concerns preservation of digital resources. It should not be treated as a direct charter on interpreting physical historic places with AR/MR. The London Charter is more directly relevant to evidence, transparency and documentation in heritage visualisation.

The Delhi Declaration on Heritage and Democracy links heritage management with rights, cultural plurality, interpretation ethics, community participation and communication technologies. It is a policy-level framework, not a practical specification for MR or gamified interpretation. Its network links to interpretation and digital-visualisation documents are thematic comparisons, not claims of direct influence.

The Timeline plots publication year (or the explicitly labelled inscription/index date) on the horizontal axis. **Bands** retains one `timeline_topic` as a primary row. **Flow** uses `topic_memberships`, an array of qualitative, nonexclusive research codes. A record is plotted once, and every assigned theme envelope passes through it. The vertical placement is a reading layout; its distance does not measure conceptual similarity. These four working themes are not established theoretical streams.

Each membership stores `topic`, `status`, `evidence`, `source_url` and `location`. `source` means an accessible original or official description has been checked at that location, not that the entire book has been reviewed. `provisional` marks researcher interpretations still awaiting close reading. A checked membership can coexist with a dashed record whose broader reading remains pending. Older imports without memberships fall back to their single Bands topic, labelled provisional. The editor supports multiple checkboxes and separate evidence for each theme. Cluster and Filters expose the same memberships.

Flow envelopes are generated from node positions and short bridges between adjacent same-theme records (gaps of more than 22 years are left open). The 22-year threshold and Gaussian width are graphic layout choices, not historical findings. Envelopes change with filtering; their width, area, overlap and continuity do not quantify influence, importance or scholarly consensus. Hovered dotted links come only from existing `relations`; their type and evidence remain in the reading card. An envelope is not a genealogical connection. The reference is Charles Jencks’s chronograms, interpreted as a visual precedent rather than a validated heritage taxonomy: https://www.e-flux.com/architecture/chronograms

Version discipline: the Burra node is dated to its first adoption in 1979. Participation and interpretation provisions from the 2013 edition are not retroactively coded onto the 1979 node. UNESCO inscriptions used for practice cases do not date every intervention. Robben Island’s 2011 mission report includes shortcomings and unimplemented plans, not only successful practice. The accessible Tongariro case page supports community volunteer involvement; it does not substantiate the earlier claim of Māori co-authoring exhibitions, which has been corrected.

Additional checked sources for multi-theme coding (2026-10-02):

- Faro Convention, Articles 1–2, 12–14: https://rm.coe.int/1680083746
- UNESCO HUL Recommendation, paragraphs 23–27: https://www.unesco.org/en/legal-affairs/recommendation-historic-urban-landscape-including-glossary-definitions
- ICOMOS 2022 Cultural Heritage Tourism Charter, Principles 1–4: https://publ.icomos.org/publicomos/jlbSai?base=technica&file=2117.pdf&html=Bur&path=eng-spa_ICHT_Charter.pdf
- Nina Simon, The Participatory Museum, Preface: https://participatorymuseum.org/preface/
- Uses of Heritage, author’s university book abstract (not the full book): https://chms.cass.anu.edu.au/research/publications/uses-heritage
- Robben Island, joint WHC/ICOMOS monitoring mission 2011, section 4.4: https://whc.unesco.org/document/141619
- Tongariro UNESCO case study: https://whc.unesco.org/en/activities/613/

`map_title` and `map_maker` are short display labels for the compact map. They do not replace the full bibliographic title, author list, or organisation in the detail panel. The editor exposes both fields.
