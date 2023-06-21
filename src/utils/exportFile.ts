import FileSaver from 'file-saver';
import { gt } from '@/utils/utils';

export const exportCsv = async (cvsArray: any[], fileName: string) => {
  try {
    if (gt(cvsArray.length, Math.pow(10, 6))) {
      alert(
        'Up to one million pieces of data can be exported. Please re filter the criteria before exporting!'
      );
      return;
    } else {
      const blob = new Blob([String.fromCharCode(0xfeff), ...cvsArray], {
        type: 'text/csv;charset=utf-8',
      });
      await FileSaver.saveAs(blob, `${fileName}.csv`);
    }
    return true;
  } catch (error) {
    return Promise.reject(error);
  }
};
export function exportJson(jsonStr: string, fileName: string) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  var url = window.URL.createObjectURL(blob);
  var aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = url;
  aLink.setAttribute('download', fileName);
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
  window.URL.revokeObjectURL(url);
}