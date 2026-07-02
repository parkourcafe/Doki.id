import Script from "next/script";

/** Подключает счётчик Yandex Metrica, если задан NEXT_PUBLIC_YM_ID. */
export default function YandexMetrika() {
  const id = process.env.NEXT_PUBLIC_YM_ID;
  if (!id) return null;
  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
        ym(${Number(id)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
      `}
    </Script>
  );
}
