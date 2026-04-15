import { default as dayjs } from 'dayjs';

export const formatDate = (date: number) => {
  return dayjs(date).format('DD/MM/YYYY');
};