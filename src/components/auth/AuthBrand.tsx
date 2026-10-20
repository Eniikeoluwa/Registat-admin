import Image from "next/image";

export default function AuthBrand() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Image src="/yellow.svg" alt="Registat" width={24} height={24} priority />
      <span className="text-2xl font-semibold tracking-tight text-[#0F172A]">
        registat
      </span>
    </div>
  );
}