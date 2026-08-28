import Link from "next/link";

type CommercialEmailConsentProps = {
  readonly id: string;
  readonly locale?: "en" | "tr";
};

export function CommercialEmailConsent({ id, locale = "tr" }: CommercialEmailConsentProps) {
  return (
    <div className="border-t border-border-subtle pt-6">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-text-primary" htmlFor={id}>
        <input
          className="mt-1 size-5 shrink-0 accent-corporate-blue"
          id={id}
          name="ticari_iletisim_onayi"
          type="checkbox"
          value="onaylandi"
        />
        <span>
          {locale === "en"
            ? "I agree to receive commercial electronic communications by email from Kalite Filo about its products, services, campaigns, benefits, opportunities, promotions and announcements. For details about the processing of personal data, please review the "
            : "Kalite Filo tarafından ürün ve hizmetler, kampanyalar, avantajlar, fırsatlar, tanıtımlar ve duyurular hakkında tarafıma e-posta yoluyla ticari elektronik ileti gönderilmesini kabul ediyorum. Kişisel verilerin işlenmesine ilişkin ayrıntılar için "}
          <Link
            className="font-semibold text-corporate-blue underline decoration-current/40 underline-offset-4 hover:text-brand-navy"
            href={locale === "en" ? "/en/privacy-notice/" : "/aydinlatma-metni/"}
          >
            {locale === "en" ? "Privacy Notice" : "Aydınlatma Metni"}
          </Link>
          {locale === "en" ? "." : "’ni inceleyebilirsiniz."}
        </span>
      </label>
    </div>
  );
}
