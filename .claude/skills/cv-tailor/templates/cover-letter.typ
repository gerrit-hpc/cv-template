// Parameterized cover letter template.
// The cv-tailor skill imports this and calls cover_letter(...) with populated arguments.

#let _defaults = (
  en: (
    salutation: "Dear Hiring Team,",
    sign_off: "Best regards,",
    date_format: "[month repr:long] [day], [year]",
  ),
  de: (
    salutation: "Sehr geehrte Damen und Herren,",
    sign_off: "Mit freundlichen Grüßen",
    date_format: "[day]. [month repr:long] [year]",
  ),
)

#let cover_letter(
  sender: (:),     // (name, address_lines: (), email, phone)
  recipient: (:),  // (company, name_or_team, address_lines: ())
  date: "",
  subject: "",
  salutation: "",
  paragraphs: (),
  sign_off: "",
  language: "en",
) = {
  set page(
    paper: "a4",
    margin: (x: 2cm, y: 2cm),
  )
  set text(font: "New Computer Modern", size: 11pt, lang: language)
  set par(justify: true, leading: 0.7em, first-line-indent: 0pt)

  let d = _defaults.at(language, default: _defaults.en)

  // Sender block (top right)
  align(right)[
    #block[
      #text(weight: "bold")[#sender.at("name", default: "")] \
      #for line in sender.at("address_lines", default: ()) [#line \ ]
      #sender.at("email", default: "")
      #if sender.at("phone", default: "") != "" [
        #h(0.4em) · #h(0.4em) #sender.at("phone")
      ]
    ]
  ]

  v(0.6em)

  // Recipient block (left)
  block[
    #if recipient.at("company", default: "") != "" [#recipient.company \ ]
    #if recipient.at("name_or_team", default: "") != "" [#recipient.name_or_team \ ]
    #for line in recipient.at("address_lines", default: ()) [#line \ ]
  ]

  v(0.4em)

  // Date (right-aligned)
  let resolved-date = if date == "" or date == none {
    datetime.today().display(d.date_format)
  } else { date }
  align(right)[#resolved-date]

  v(0.6em)

  // Subject
  if subject != "" and subject != none {
    block[
      #text(weight: "bold")[#subject]
    ]
    v(0.2em)
  }

  // Salutation
  let resolved-salutation = if salutation == "" or salutation == none { d.salutation } else { salutation }
  block(resolved-salutation)
  v(0.4em)

  // Body paragraphs
  for para in paragraphs {
    block(para)
    v(0.4em)
  }

  // Sign-off
  let resolved-signoff = if sign_off == "" or sign_off == none { d.sign_off } else { sign_off }
  v(0.4em)
  block(resolved-signoff)
  v(0.6em)
  block(sender.at("name", default: ""))
}
