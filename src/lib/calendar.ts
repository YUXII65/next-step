import { Solar } from "lunar-javascript";

export type CalendarDateInfo = {
  dayNumber: string;
  monthText: string;
  weekday: string;
  lunarDate: string;
  yearText: string;
  dayText: string;
  solarTerm: string;
  festivals: string[];
};

export function getCalendarDateInfo(date: Date): CalendarDateInfo {
  const solar = Solar.fromYmd(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const lunar = solar.getLunar();

  return {
    dayNumber: String(date.getDate()).padStart(2, "0"),
    monthText: `${date.getMonth() + 1}月`,
    weekday: solar.getWeekInChinese(),
    lunarDate: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearText: `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年`,
    dayText: `${lunar.getDayInGanZhi()}${lunar.getDayShengXiao()}日`,
    solarTerm: lunar.getJieQi(),
    festivals: Array.from(
      new Set([...solar.getFestivals(), ...lunar.getFestivals()]),
    ),
  };
}
