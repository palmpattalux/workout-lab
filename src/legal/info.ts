// Who runs Dotset, as shown in the Terms, Privacy Policy and Refund Policy ({{key}} in src/legal/*.md).
// Fill in the owner's legal name and address before going live (Omise, Apple and Google ask for them).
const phone = '+66 91 942 3963'         // contact phone, e.g. '+66 81 234 5678' (Omise wants one on the website)

export const LEGAL = {
  owner: 'Pattalux Taongam',              // legal name of the person (or company) running Dotset
  ownerTh: 'Pattalux Taongam',
  address: '54/49-50 Moo 5, Nonthaburi 1 Road, Bang Krasor, Mueang Nonthaburi, Nonthaburi 11000, Thailand', // registered business address
  addressTh: '54/49-50 หมู่ 5 ถนนนนทบุรี 1 ตำบลบางกระสอ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
  email: 'hello@dotset.app',              // support and privacy contact
  phone,
  phoneLine: phone ? `. Phone: ${phone}` : '',
  phoneLineTh: phone ? ` โทร: ${phone}` : '',
  updated: '19 October 2026',
  updatedTh: '19 ตุลาคม 2569',
}
