import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-2 sm:px-4 py-8" style={{ marginTop: '30px' }}>
      <div className="flex flex-col items-center justify-center gap-6 ">
        <div className="">
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-bold leading-tight">Welcome to</p>
            <Image 
                src="/PremierLeaguePredictionsLogo.svg" 
                width={270}
                height={186}
                alt="Premier League Predictions"
                className="w-[190px] sm:w-[230px] h-auto pt-0"
            />        
        </div>
        <p className="text-[#253635] font-medium text-sm sm:text-md md:text-md text-left max-w-md">
          All predictions are in. Let&apos;s see how they do!
        </p>
        <div className="sm:text-xs md:text-md flex gap-4">
          <Link href="/leaderboard">
            <Button variant="outline" size="default" className="sm:text-[10px] md:text-md lg:text-[14px]">View Leaderboard</Button>
          </Link>
        </div>
      <div className="mx-auto py-4 px-4 rounded-lg bg-secondary text-secondary-foreground border border-border">
        <p className="text-xs sm:text-[6px] md:text-[12px] lg:text-[14px] font-bold">Points System</p>
        <p className="text-xs sm:text-[6px] md:text-[12px] lg:text-[14px]">Correct prediction = 2 points</p> 
        <p className="text-xs sm:text-[6px] md:text-[12px] lg:text-[14px]">Near miss = 1 point</p>

        <p className="text-xs sm:text-[6px] md:text-[12px] lg:text-[14px] font-bold mt-4">Bonus Points</p>
        {/* <p className="sm:text-xs md:text-md">Champion = 1 point</p> */}
        <p className="text-xs sm:text-[6px] md:text-[12px]">Top 4 (Prediction and Actual) = additional 1 point</p>
        <p className="text-xs sm:text-[6px] md:text-[12px]">Relegation Zone (Prediction and Actual) = additional 1 point</p>
      </div>
        <div className="sm:mt-16 md:mt-24 lg:mt-24 sm:text-[6px] md:text-[8px] flex gap-4">
          <p className='text-xs'>Brought to you by <span className="text-red-600 font-bold"> Dont Be aC*nt </span>productions</p>
        </div>
      </div>
    </main>
  );
}
