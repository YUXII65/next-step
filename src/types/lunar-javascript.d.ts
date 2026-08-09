declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getWeekInChinese(): string;
    getFestivals(): string[];
    getLunar(): Lunar;
  }

  export class Lunar {
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getYearShengXiao(): string;
    getDayInGanZhi(): string;
    getDayShengXiao(): string;
    getJieQi(): string;
    getFestivals(): string[];
  }
}
