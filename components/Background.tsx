import Image from "next/image";
import { BACKGROUND_IMAGE_URL } from "@/config/assets";

export function Background() {
  return (
    <div className="fixed inset-0 z-0">
      <Image
        src={BACKGROUND_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
