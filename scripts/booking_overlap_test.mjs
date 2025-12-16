import { format, addMinutes, startOfDay, addDays } from 'date-fns';

const pad = (n) => n.toString().padStart(2, '0');
const log = console.log;

function toLocalISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function overlaps(aStart, aEnd, bStart, bEnd, bufferMins = 15) {
  const bs = new Date(bStart).getTime() - bufferMins*60000;
  const be = new Date(bEnd).getTime() + bufferMins*60000;
  return new Date(aStart).getTime() < be && new Date(aEnd).getTime() > bs;
}

function isDayBookingConflict(existingBookings, selectedDateStr, numberOfNights = 1, bufferMins = 15) {
  const checkIn = new Date(`${selectedDateStr}T14:00:00`);
  const checkOutDate = new Date(checkIn);
  checkOutDate.setDate(checkOutDate.getDate() + numberOfNights);
  checkOutDate.setHours(12,0,0,0);
  const reqStart = new Date(checkIn.getTime() - bufferMins*60000);
  const reqEnd = new Date(checkOutDate.getTime() + bufferMins*60000);

  for (const b of existingBookings) {
    const bStart = new Date(b.start);
    const bEnd = new Date(b.end);
    if (reqStart < bEnd && reqEnd > bStart) return true;
  }
  return false;
}

function daySetFromBookings(bookings) {
  const set = new Set();
  for (const b of bookings) {
    const s = startOfDay(new Date(b.start));
    const e = startOfDay(new Date(b.end));
    const endExclusive = new Date(e);
    endExclusive.setDate(endExclusive.getDate() - 1);
    if (endExclusive >= s) {
      for (let d = new Date(s); d <= endExclusive; d.setDate(d.getDate()+1)) {
        set.add(format(d, 'yyyy-MM-dd'));
      }
    }
  }
  return set;
}

function isCheckInDateDisabledByDaySet(bookings, candidateDateStr, numberOfNights=1) {
  const set = daySetFromBookings(bookings);
  for (let n=0;n<numberOfNights;n++){
    const d = new Date(candidateDateStr);
    d.setDate(d.getDate()+n);
    const key = format(d, 'yyyy-MM-dd');
    if (set.has(key)) return true;
  }
  return false;
}

// Scenarios
const scenarios = [];

// A: Overnight existing booking should block same-day checkin
scenarios.push({
  name: 'A - overnight blocks',
  existing: [{ start: '2025-12-20T14:00:00', end: '2025-12-21T12:00:00' }],
  selectedDate: '2025-12-20', nights: 1, expectedTimeConflict: true, expectedDayDisabled: true
});

// B: short slot should NOT block day booking
scenarios.push({
  name: 'B - short slot does not block day',
  existing: [{ start: '2025-12-20T08:00:00', end: '2025-12-20T10:00:00' }],
  selectedDate: '2025-12-20', nights: 1, expectedTimeConflict: false, expectedDayDisabled: false
});

// C: multi-night overlap
scenarios.push({
  name: 'C - multi-night overlap',
  existing: [{ start: '2025-12-22T14:00:00', end: '2025-12-24T12:00:00' }], // occupies 22,23
  tests: [
    { sel: '2025-12-21', nights: 2, expect: true }, // 21+2 => 21,22 -> overlaps
    { sel: '2025-12-22', nights: 2, expect: true }, // 22+2 => 22,23 -> overlaps
    { sel: '2025-12-24', nights: 1, expect: false } // 24 => 24 only -> no overlap
  ]
});

// D: buffer edge cases
scenarios.push({
  name: 'D - buffer edge cases',
  existing: [
    { start: '2025-12-24T08:00:00', end: '2025-12-24T12:14:00' }, // ends 12:14
    { start: '2025-12-24T08:00:00', end: '2025-12-24T13:50:00' }  // ends 13:50
  ],
  tests: [
    { sel: '2025-12-24', nights: 1, expectForFirst: false, expectForSecond: true }
  ]
});

log('Running booking overlap tests...');
for (const s of scenarios) {
  if (s.name === 'C - multi-night overlap') {
    log('\nScenario C - multi-night overlap');
    for (const t of s.tests) {
      const conflict = isDayBookingConflict(s.existing, t.sel, t.nights, 15);
      const dayDisabled = isCheckInDateDisabledByDaySet(s.existing, t.sel, t.nights);
      log(`Test: select ${t.sel} nights=${t.nights} -> timeConflict=${conflict} (expected ${t.expect}), dayDisabled=${dayDisabled}`);
    }
    continue;
  }
  if (s.name === 'D - buffer edge cases') {
    log('\nScenario D - buffer edge cases');
    const first = [s.existing[0]];
    const second = [s.existing[1]];
    const t = s.tests[0];
    const c1 = isDayBookingConflict(first, t.sel, t.nights, 15);
    const c2 = isDayBookingConflict(second, t.sel, t.nights, 15);
    log(`Existing end=12:14 -> select ${t.sel} nights=${t.nights} -> timeConflict=${c1} (expected ${t.expectForFirst})`);
    log(`Existing end=13:50 -> select ${t.sel} nights=${t.nights} -> timeConflict=${c2} (expected ${t.expectForSecond})`);
    continue;
  }

  log(`\nScenario ${s.name}`);
  const conflict = isDayBookingConflict(s.existing, s.selectedDate, s.nights, 15);
  const dayDisabled = isCheckInDateDisabledByDaySet(s.existing, s.selectedDate, s.nights);
  log(`Existing: ${JSON.stringify(s.existing)}\nSelect ${s.selectedDate} nights=${s.nights} -> timeConflict=${conflict} (expected ${s.expectedTimeConflict}), dayDisabled=${dayDisabled} (expected ${s.expectedDayDisabled})`);
}

log('\nTest run complete.');
