import { NextResponse } from "next/server";

/**
 * GET /api/v1/loader/[shopId]
 *
 * 경량 Loader JS 스크립트 반환.
 * 쇼핑몰 <head>에 이 스크립트를 삽입하면
 * 현재 페이지 URL에 매칭되는 JSON-LD를 자동 주입.
 *
 * PRD 요구사항: < 10KB (gzip)
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chatsio-topaz.vercel.app";

function buildLoaderScript(shopId: string): string {
  // 즉시 실행 함수로 전역 오염 방지. 압축 시 < 1KB.
  return `(function(){
  "use strict";
  var API="${SITE_URL}/api/v1/jsonld/${shopId}";
  var url=encodeURIComponent(window.location.href.split("?")[0].split("#")[0]);
  var xhr=new XMLHttpRequest();
  xhr.open("GET",API+"?url="+url,true);
  xhr.onreadystatechange=function(){
    if(xhr.readyState!==4||xhr.status!==200)return;
    try{
      var res=JSON.parse(xhr.responseText);
      if(!res.jsonld)return;
      var el=document.createElement("script");
      el.type="application/ld+json";
      el.textContent=JSON.stringify(res.jsonld);
      document.head.appendChild(el);
    }catch(e){}
  };
  xhr.send();
})();`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string }> },
): Promise<NextResponse> {
  const { shopId } = await params;
  const script = buildLoaderScript(shopId);

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
