import { formatBaht, type Baht } from "@/domain/money";

export type ReadyScreenProps = {
  shopName: string;
  orderNo: string;
  itemsLine: string;
  total: Baht;
  ringing: boolean;
  onStop: () => void;
};

export function ReadyScreen({ shopName, orderNo, itemsLine, total, ringing, onStop }: ReadyScreenProps) {
  return (
    <div className="flex min-h-dvh w-full bg-ok text-center text-white">
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-[22px] px-5 py-6">
        <header className="flex items-center justify-between gap-3 self-stretch px-1">
          <span className="text-[17px] font-bold">{shopName}</span>
          <span className="text-[14px] text-[#e6f4ec]">บิลของคุณ</span>
        </header>

        <div aria-hidden="true" className="relative mt-9 flex size-[132px] items-center justify-center">
          {ringing && (
            <>
              <span className="absolute inset-0 hidden rounded-full border-[3px] border-white motion-safe:block motion-safe:animate-ready-ring" />
              <span className="absolute inset-0 hidden rounded-full border-[3px] border-white [animation-delay:0.7s] motion-safe:block motion-safe:animate-ready-ring" />
            </>
          )}
          <span className="relative flex size-[132px] items-center justify-center rounded-full bg-white text-ok">
            {ringing ? (
              <svg className="motion-safe:animate-ready-shake" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
                <path d="M10 21h4" />
              </svg>
            ) : (
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
          </span>
        </div>

        <div role="alert" className="flex flex-col gap-1.5">
          <h1 className="text-[38px] leading-[1.2] font-bold">ของพร้อมแล้ว!</h1>
          <p className="text-[18px] text-[#e6f4ec]">มารับที่หน้าร้านได้เลย</p>
        </div>

        <div className="flex flex-col gap-0.5 self-stretch rounded-[28px] bg-white px-5 pt-[18px] pb-[22px] text-ink">
          <span className="text-[15px] text-ink-2">แสดงเลขนี้ให้พนักงาน</span>
          <span className="text-[96px] leading-none font-bold tracking-[-1px] text-ok">{orderNo}</span>
          <span className="text-[15px] text-ink-2">
            {itemsLine} · {formatBaht(total)}
          </span>
        </div>

        {ringing ? (
          <button
            type="button"
            onClick={onStop}
            className="mt-auto flex h-[60px] cursor-pointer items-center justify-center gap-2.5 self-stretch rounded-[18px] border-2 border-white bg-transparent text-[18px] font-bold text-white"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 16V11a6 6 0 0 1 9.5-4.9" />
              <path d="M18 11v5l2 2H8" />
              <path d="M10 21h4" />
              <path d="M4 4l16 16" />
            </svg>
            ปิดเสียงเตือน
          </button>
        ) : (
          <p role="status" className="mt-auto flex h-[60px] items-center justify-center self-stretch text-[17px] font-semibold text-[#e6f4ec]">
            ปิดเสียงแล้ว · ขอบคุณที่อุดหนุน
          </p>
        )}
      </div>
    </div>
  );
}
