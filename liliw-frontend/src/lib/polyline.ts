/**
 * Google's polyline encoding — the compact string format Mapbox's Static
 * Images API expects for a `path-` overlay, and the same one Directions
 * responses come back in. One implementation, since both directions need it.
 */
export function encodePolyline(points: [lat: number, lng: number][]): string {
  let output = '';
  let prevLat = 0, prevLng = 0;

  const encodeSigned = (num: number): string => {
    let n = num << 1;
    if (num < 0) n = ~n;
    let out = '';
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return out + String.fromCharCode(n + 63);
  };

  for (const [lat, lng] of points) {
    const lat5 = Math.round(lat * 1e5);
    const lng5 = Math.round(lng * 1e5);
    output += encodeSigned(lat5 - prevLat) + encodeSigned(lng5 - prevLng);
    prevLat = lat5;
    prevLng = lng5;
  }
  return output;
}
