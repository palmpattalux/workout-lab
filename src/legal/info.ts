// Who runs Dotset, as shown in the Terms, Privacy Policy and Refund Policy ({{key}} in src/legal/*.md).
// Fill in the owner's legal name and address before going live (Omise, Apple and Google ask for them).
const phone = ''                        // contact phone, e.g. '+66 81 234 5678' (Omise wants one on the website)

export const LEGAL = {
  owner: 'the owner of Dotset',          // legal name of the person (or company) running Dotset
  ownerTh: 'เจ้าของ Dotset',
  address: 'Bangkok, Thailand',           // registered business address
  email: 'hello@dotset.app',              // support and privacy contact
  phone,
  phoneLine: phone ? `. Phone: ${phone}` : '',
  phoneLineTh: phone ? ` โทร: ${phone}` : '',
  updated: '19 October 2026',
  updatedTh: '19 ตุลาคม 2569',
}
