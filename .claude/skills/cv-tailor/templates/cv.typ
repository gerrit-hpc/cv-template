// Parameterized CV template.
// The cv-tailor skill imports this and calls cv(...) with populated arguments.
// Section headings localize on the `language` parameter ("en" or "de").

#let _section-headings = (
  en: (
    summary: "Professional Summary",
    qualifications: "Key Qualifications",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
  ),
  de: (
    summary: "Profil",
    qualifications: "Wesentliche Qualifikationen",
    experience: "Berufserfahrung",
    skills: "Kenntnisse",
    education: "Ausbildung",
    languages: "Sprachen",
  ),
)

#let _section(title) = {
  v(0.6em)
  block[
    #set text(size: 11pt, weight: "bold", tracking: 0.5pt)
    #upper(title)
    #v(-0.4em)
    #line(length: 100%, stroke: 0.5pt + rgb("#999"))
  ]
  v(0.2em)
}

#let _contact-bits(email, phone, linkedin, github, website) = {
  let bits = ()
  if email != "" and email != none { bits.push(email) }
  if phone != "" and phone != none { bits.push(phone) }
  if linkedin != "" and linkedin != none { bits.push(linkedin) }
  if github != "" and github != none { bits.push(github) }
  if website != "" and website != none { bits.push(website) }
  bits.join("  ·  ")
}

#let cv(
  name: "",
  headline: "",
  location: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  website: "",
  summary: "",
  qualifications: (),
  experience: (),
  skills_groups: (),
  education: (),
  languages_spoken: (),
  language: "en",
) = {
  set page(
    paper: "a4",
    margin: (x: 1.8cm, y: 1.6cm),
  )
  set text(font: "New Computer Modern", size: 10pt, lang: language)
  set par(justify: false, leading: 0.6em)
  show heading: set text(weight: "bold")

  let headings = _section-headings.at(language, default: _section-headings.en)

  // Header
  block[
    #set text(size: 22pt, weight: "bold")
    #name
  ]
  if headline != "" {
    block[
      #set text(size: 11pt, style: "italic")
      #headline
    ]
  }
  v(0.2em)
  let contact-line = _contact-bits(email, phone, linkedin, github, website)
  let header-bits = ()
  if location != "" and location != none { header-bits.push(location) }
  if contact-line != "" { header-bits.push(contact-line) }
  if header-bits.len() > 0 {
    block[
      #set text(size: 9.5pt, fill: rgb("#444"))
      #header-bits.join("  ·  ")
    ]
  }

  // Summary
  if summary != "" and summary != none {
    _section(headings.summary)
    block(summary)
  }

  // Qualifications
  if qualifications.len() > 0 {
    _section(headings.qualifications)
    list(..qualifications)
  }

  // Skills (placed before Experience for ATS keyword matching)
  if skills_groups.len() > 0 {
    _section(headings.skills)
    for group in skills_groups {
      block({
        text(weight: "bold", group.heading + ":")
        h(0.3em)
        group.items.join(", ")
      })
      v(0.1em)
    }
  }

  // Experience
  if experience.len() > 0 {
    _section(headings.experience)
    for role in experience {
      let dates-line = role.dates
      if role.at("location", default: "") != "" {
        dates-line = role.dates + " · " + role.location
      }
      block(breakable: false, {
        grid(
          columns: (1fr, auto),
          column-gutter: 0.5em,
          align: (left + horizon, right + horizon),
          [#text(weight: "bold", size: 11pt)[#role.company] #text(fill: rgb("#444"))[ — #role.title]],
          text(size: 9.5pt, fill: rgb("#444"), dates-line),
        )
        v(0.1em)
        if role.at("bullets", default: ()).len() > 0 {
          list(..role.bullets)
        } else if role.at("summary", default: "") != "" {
          [#role.summary]
        }
      })
      v(0.4em)
    }
  }

  // Education
  if education.len() > 0 {
    _section(headings.education)
    for entry in education {
      block({
        grid(
          columns: (1fr, auto),
          column-gutter: 0.5em,
          align: (left + horizon, right + horizon),
          [#text(weight: "bold")[#entry.degree] — #entry.institution],
          text(size: 9.5pt, fill: rgb("#444"), entry.dates),
        )
        if entry.at("notes", default: "") != "" {
          v(0.1em)
          text(size: 9.5pt, entry.notes)
        }
      })
      v(0.2em)
    }
  }

  // Languages
  if languages_spoken.len() > 0 {
    _section(headings.languages)
    let parts = languages_spoken.map(l => [*#l.name* (#l.level)])
    parts.join("  ·  ")
  }
}
