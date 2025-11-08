# 🔧 Fix: NaN Warning trong Input Number

## ❌ Lỗi

```
Warning: Received NaN for the `value` attribute. 
If this is expected, cast the value to a string.
```

**Vị trí**: 
- `BookingPage.tsx` - Số khách input
- `NewBooking.tsx` - Số lượng khách input

## 🐛 Nguyên nhân

Khi user xóa hết nội dung input type="number", `e.target.value` trả về empty string `""`.

```tsx
// ❌ Code cũ - Lỗi
onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
// parseInt("") → NaN
// React warning: <input value={NaN} />
```

## ✅ Giải pháp

Kiểm tra NaN và set giá trị mặc định:

```tsx
// ✅ Code mới - Fixed
onChange={(e) => {
  const value = parseInt(e.target.value);
  setNumberOfGuests(isNaN(value) ? 1 : value);
}}
```

## 📝 Chi tiết Fix

### 1. BookingPage.tsx (Line 462-472)

**Trước:**
```tsx
<input
  type="number"
  min="1"
  max="10"
  value={numberOfGuests}
  onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
/>
```

**Sau:**
```tsx
<input
  type="number"
  min="1"
  max="10"
  value={numberOfGuests}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    setNumberOfGuests(isNaN(value) ? 1 : value);
  }}
/>
```

### 2. NewBooking.tsx (Line 180-189)

**Trước:**
```tsx
<input
  type="number"
  required
  min="1"
  value={formData.numberOfGuests}
  onChange={(e) => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})}
/>
```

**Sau:**
```tsx
<input
  type="number"
  required
  min="1"
  value={formData.numberOfGuests}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    setFormData({...formData, numberOfGuests: isNaN(value) ? 1 : value});
  }}
/>
```

## 🧪 Test Cases

### Test 1: Normal Input
```
User types: "5"
→ parseInt("5") = 5
→ isNaN(5) = false
→ Result: 5 ✅
```

### Test 2: Empty Input (Delete all)
```
User deletes all → ""
→ parseInt("") = NaN
→ isNaN(NaN) = true
→ Result: 1 (default) ✅
```

### Test 3: Invalid Input
```
User types: "abc"
→ parseInt("abc") = NaN
→ isNaN(NaN) = true
→ Result: 1 (default) ✅
```

### Test 4: Decimal Input
```
User types: "2.5"
→ parseInt("2.5") = 2
→ isNaN(2) = false
→ Result: 2 ✅
```

## 🔍 Các Input Number Khác

Kiểm tra tất cả input type="number" trong project:

### ✅ Safe (không cần fix)

**RoomManagement.tsx** - Giá phòng inputs:
```tsx
<Input
  type="number"
  value={conceptForm.gia_gio}
  onChange={(e) => setConceptForm({ ...conceptForm, gia_gio: e.target.value })}
/>
```
→ Safe vì lưu dưới dạng **string** trong state
→ Không parse sang number → Không có NaN

## 🎯 Best Practices

### ✅ DO: Handle NaN cho parseInt/parseFloat
```tsx
onChange={(e) => {
  const value = parseInt(e.target.value);
  setState(isNaN(value) ? defaultValue : value);
}}
```

### ✅ DO: Hoặc dùng string trong state
```tsx
// Store as string, parse when needed
const [price, setPrice] = useState('');
onChange={(e) => setPrice(e.target.value)}

// Parse khi submit
const finalPrice = parseInt(price) || 0;
```

### ❌ DON'T: Parse trực tiếp không check
```tsx
onChange={(e) => setState(parseInt(e.target.value))} // ❌ Can be NaN!
```

### ❌ DON'T: Dùng || với 0
```tsx
const value = parseInt(e.target.value) || 1; // ❌ 
// Nếu user nhập 0 → bị replace thành 1!
```

**Correct:**
```tsx
const value = parseInt(e.target.value);
setState(isNaN(value) ? 1 : value); // ✅
```

## 📊 Impact

**Files Changed**: 2
- `/components/customer/BookingPage.tsx`
- `/components/staff/NewBooking.tsx`

**Lines Changed**: 12 lines

**Warning Resolved**: ✅ No more NaN warnings in console

## ✅ Verification

Run app và test:
1. Vào `/booking`
2. Chọn phòng → Next
3. Ở field "Số khách", xóa hết số
4. Check console → No warning ✅
5. Type số mới → Works ✅

## 🚀 Additional Improvements (Future)

### Option 1: Use controlled input với validation
```tsx
const [guests, setGuests] = useState('2'); // string state

onChange={(e) => {
  const value = e.target.value;
  if (value === '' || /^\d+$/.test(value)) {
    setGuests(value);
  }
}}

// Convert when needed
const guestsNumber = parseInt(guests) || 1;
```

### Option 2: Custom NumberInput Component
```tsx
function NumberInput({ value, onChange, min = 0, max, defaultValue = 0 }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value);
    onChange(isNaN(parsed) ? defaultValue : Math.max(min, Math.min(max || Infinity, parsed)));
  };
  
  return <input type="number" value={value} onChange={handleChange} />;
}
```

---

**Fixed**: 08/11/2025  
**Version**: 1.2.2  
**Status**: ✅ Resolved
