// Line icons shared by the interface and the How to play cards. 24x24, drawn in currentColor.
const svg = (d, fill = false) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const IC = {
  back: svg('M14.5 5.5L8 12l6.5 6.5'), menu: svg('M5 7h14M5 12h14M5 17h14'), close: svg('M6 6l12 12M18 6L6 18'),
  skip: svg('M5 6l7 6-7 6zM13 6l7 6-7 6z', true), log: svg('M6 5h12M6 10h12M6 15h8M6 20h5'),
  find: svg('M10.5 4a6.500 6.500 0 1 0 0 13a6.500 6.500 0 0 0 0-13zM15.500 15.500L20 20'), lock: svg('M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z'),
  heart: svg('M12 20s-7.500-4.600-7.500-10A4.300 4.300 0 0 1 12 7.500 4.300 4.300 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10z', true),
  book: svg('M4 5.500C6.500 4.500 9.500 4.500 12 6c2.500-1.500 5.500-1.500 8-.5v13c-2.500-1-5.500-1-8 .5-2.500-1.500-5.500-1.500-8-.5zM12 6v13'),
  star: svg('M12 3l2.500 5.600 6 .7-4.500 4 1.300 6L12 16.200 6.700 19.300l1.300-6-4.500-4 6-.7z', true),
  up: svg('M12 19V5.500M6 11l6-6 6 6'), chat: svg('M5 6h14v10h-7l-4 3.500V16H5z'), hand: svg('M6 20l2-9 4-1 2-5 3 1-1 5 3 2-2 7z'),
  gear: svg('M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100'),
  lantern: svg('M9 4h6M8 7h8l2 5-2 5H8l-2-5zM10 20h4M12 7v10'),
};
