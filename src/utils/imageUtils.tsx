// Nhóm ảnh phòng theo từng set có liên quan đến nhau
// Mỗi nhóm có 4 ảnh với phong cách/màu sắc/góc nhìn tương đồng
export const ROOM_IMAGE_SETS = [
  // Set 1: Phòng tối giản hiện đại (Modern Minimalist)
  [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'
  ],
  // Set 2: Phòng ấm cúng gỗ (Cozy Wooden)
  [
    'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800',
    'https://images.unsplash.com/photo-1616594266888-94844421a5a2?w=800',
    'https://images.unsplash.com/photo-1566908829550-e6551b00979b?w=800',
    'https://images.unsplash.com/photo-1578898887155-72dde5fb0e3f?w=800'
  ],
  // Set 3: Phòng sang trọng (Luxury)
  [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'
  ],
  // Set 4: Phòng sáng thoáng (Bright & Airy)
  [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'
  ],
  // Set 5: Phòng vintage/rustic
  [
    'https://images.unsplash.com/photo-1571508601936-2ba48dca1f5e?w=800',
    'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800'
  ]
];

// Flatten để tương thích với code cũ
export const ROOM_IMAGES = ROOM_IMAGE_SETS.flat();

export const LOCATION_IMAGES = [
  // Ảnh các toà nhà, khách sạn, homestay - từ Unsplash với quality cao
  'https://images.unsplash.com/photo-1648634158203-199accfd7afc?w=1080&q=80',
  'https://images.unsplash.com/photo-1611095459865-47682ae3c41c?w=1080&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1080&q=80',
  'https://images.unsplash.com/photo-1654075309556-14a41021eedb?w=1080&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1080&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1080&q=80',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1080&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1080&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1080&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080&q=80'
];

// Hash string thành số để chọn ảnh nhất quán
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Lấy ảnh phòng dựa trên ID/tên - luôn trả về cùng ảnh cho cùng ID
 */
export function getRoomImage(identifier: any): string {
  try {
    if (identifier === null || identifier === undefined) {
      return ROOM_IMAGES[0];
    }

    const idStr = String(identifier);
    if (!idStr) return ROOM_IMAGES[0];

    const hash = hashString(idStr);
    const index = hash % ROOM_IMAGES.length;
    return ROOM_IMAGES[index];
  } catch (e) {
    // In case of unexpected input types, fall back to a default image
    console.error('getRoomImage error:', e, 'identifier:', identifier);
    return ROOM_IMAGES[0];
  }
}

/**
 * Lấy nhiều ảnh phòng (3-5 ảnh) dựa trên ID
 * Các ảnh sẽ thuộc cùng 1 set có phong cách liên quan
 */
export function getRoomImages(identifier: any, count: number = 4): string[] {
  try {
    if (identifier === null || identifier === undefined) {
      return ROOM_IMAGE_SETS[0].slice(0, count);
    }

    const idStr = String(identifier);
    if (!idStr) return ROOM_IMAGE_SETS[0].slice(0, count);

    // Hash để chọn set ảnh
    const hash = hashString(idStr);
    const setIndex = hash % ROOM_IMAGE_SETS.length;
    const imageSet = ROOM_IMAGE_SETS[setIndex];

    // Nếu cần nhiều hơn số ảnh trong set, lặp lại từ đầu
    const images: string[] = [];
    for (let i = 0; i < count; i++) {
      images.push(imageSet[i % imageSet.length]);
    }

    return images;
  } catch (e) {
    console.error('getRoomImages error:', e, 'identifier:', identifier);
    return ROOM_IMAGE_SETS[0].slice(0, count);
  }
}

/**
 * Lấy ảnh cơ sở dựa trên ID/tên - luôn trả về cùng ảnh cho cùng ID
 */
export function getLocationImage(identifier: any): string {
  try {
    if (identifier === null || identifier === undefined) {
      return LOCATION_IMAGES[0];
    }

    const idStr = String(identifier);
    if (!idStr) return LOCATION_IMAGES[0];

    const hash = hashString(idStr);
    const index = hash % LOCATION_IMAGES.length;
    return LOCATION_IMAGES[index];
  } catch (e) {
    console.error('getLocationImage error:', e, 'identifier:', identifier);
    return LOCATION_IMAGES[0];
  }
}

/**
 * Format tiền tệ VND
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format ngày giờ theo định dạng Việt Nam
 */
export function formatDateTime(dateString: string, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const date = new Date(dateString);

  if (format === 'date') {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (format === 'time') {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
