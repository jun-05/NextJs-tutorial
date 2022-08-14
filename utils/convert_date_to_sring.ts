import moment from 'moment';

function convertDateToString(dateString: string): string {
  const dateTime = moment(dateString, moment.ISO_8601).milliseconds(0);
  const now = moment();

  const diff = now.diff(dateTime);
  const calDuration = moment.duration(diff);
  const years = calDuration.years();
  const months = calDuration.months();
  const days = calDuration.days();
  const hours = calDuration.hours();
  const minutes = calDuration.minutes();
  const seconds = calDuration.seconds();

  // 60초 이내 -> n초
  // 1시간 이내의 시간 -> n분
  // 1일 이내 -> n시
  // 1년 이내 -> n일
  // 그 이상 -> n년
  if (
    years === 0 &&
    days === 0 &&
    months === 0 &&
    hours === 0 &&
    minutes === 0 &&
    seconds !== undefined &&
    (seconds === 0 || seconds < 1)
  ) {
    return '0초';
  }
  if (
    years === 0 &&
    months === 0 &&
    days === 0 &&
    hours === 0 &&
    minutes === 0 &&
    seconds
  ) {
    return `${Math.floor(seconds)}초`;
  }
  if (years === 0 && months === 0 && days === 0 && hours === 0) {
    return `${minutes}분`;
  }
  if (years === 0 && months === 0 && days === 0) {
    return `${hours}시`;
  }
  if (years === 0 && months === 0) {
    return `${days}일`;
  }
  if (years === 0) {
    return `${months}월`;
  }
  return `${years}년`;
}

export default convertDateToString;
