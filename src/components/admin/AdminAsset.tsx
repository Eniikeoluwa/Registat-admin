import Image from "next/image";

const assets: Record<string, [string, number, number]> = {
  logo: ["2ea34.svg", 92.3456, 22.0001], home: ["3a799.svg", 20, 20], inbox: ["05a71.svg", 20, 20],
  badge: ["a071d.svg", 24, 24], users: ["ddbb9.svg", 20, 20], globe: ["77944.svg", 20, 20],
  gear: ["ca314.svg", 20, 20], star: ["c8f25.svg", 14, 14], profileSettings: ["58cdb.svg", 20, 20],
  search: ["20062.svg", 16, 16], bell: ["7f46a.svg", 20, 20], down: ["1c2ca.svg", 14, 14],
  greetingBell: ["5c37b.svg", 20, 20], smallDown: ["20bd2.svg", 11.22, 12], flash: ["7eadb.svg", 16, 16],
  review: ["95c5d.svg", 13.08, 13.08], right: ["7e0c4.svg", 20, 20], country: ["c99da.svg", 13.06, 13.06],
  services: ["cb747.svg", 13.06, 13.06], refund: ["ee812.svg", 13.06, 13.06],
  payments: ["d9e48.svg", 16, 16], clock: ["0669e.svg", 16, 16], chart: ["3adb2.svg", 16, 16],
  documentApproved: ["516db.svg", 14, 14], paymentReceived: ["2b355.svg", 14, 14],
  applicationSubmitted: ["1cb84.svg", 14, 14], informationRequested: ["52a1a.svg", 14, 14],
  statusUpdated: ["1c5ba.svg", 14, 14], news: ["c9291.svg", 14, 14], arrow: ["a554c.svg", 7.10156, 2.8125],
};

export default function AdminAsset({ name, alt = "" }: { name: string; alt?: string }) {
  const [file, width, height] = assets[name];
  return <Image src={`/admin/${file}`} alt={alt} width={width} height={height} unoptimized className="shrink-0" />;
}
