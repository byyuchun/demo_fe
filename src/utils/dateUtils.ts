import moment from 'moment';

/**
 * 将日期转换为RFC3339格式字符串
 * @param date moment对象或日期字符串
 * @param isEndOfDay 是否设置为当天结束时间
 * @returns RFC3339格式的日期字符串
 */
export function toRFC3339(date: any, isEndOfDay: boolean = false): string {
  const momentDate = moment(date);
  if (isEndOfDay) {
    return momentDate.endOf('day').toISOString();
  } else {
    return momentDate.startOf('day').toISOString();
  }
}

/**
 * 将日期时间转换为RFC3339格式字符串（保持原有时间）
 * @param datetime moment对象或日期时间字符串
 * @returns RFC3339格式的日期时间字符串
 */
export function datetimeToRFC3339(datetime: any): string {
  return moment(datetime).toISOString();
}

/**
 * 将本地日期时间转换为RFC3339格式字符串（不进行时区转换）
 * @param datetime moment对象或日期时间字符串
 * @returns RFC3339格式的日期时间字符串（本地时间）
 */
export function localDatetimeToRFC3339(datetime: any): string {
  const m = moment(datetime);
  return m.format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

/**
 * 将本地日期转换为RFC3339格式字符串（不进行时区转换）
 * @param date moment对象或日期字符串
 * @param isEndOfDay 是否设置为当天结束时间
 * @returns RFC3339格式的日期字符串（本地时间）
 */
export function localDateToRFC3339(date: any, isEndOfDay: boolean = false): string {
  const m = moment(date);
  if (isEndOfDay) {
    return m.format('YYYY-MM-DD') + 'T23:59:59Z';
  } else {
    return m.format('YYYY-MM-DD') + 'T00:00:00Z';
  }
}

/**
 * 格式化日期显示（用于UI显示）
 * @param date 日期字符串
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDateDisplay(date: string): string {
  return moment(date).format('YYYY-MM-DD');
}

/**
 * 格式化日期时间显示（用于UI显示）
 * @param datetime 日期时间字符串
 * @returns 格式化后的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatDatetimeDisplay(datetime: string): string {
  return moment(datetime).format('YYYY-MM-DD HH:mm:ss');
} 