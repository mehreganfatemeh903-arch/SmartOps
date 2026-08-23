import fitz
import re
import os


# =====================================================
# Regex
# فقط حروف فارسی و عربی
# =====================================================

PERSIAN_PATTERN = re.compile(
    r'[\u0600-\u06FF]+'
)


# =====================================================
# Reverse فقط بخش فارسی
# =====================================================

def reverse_persian_parts(text):
    """
    فقط قسمت های فارسی را reverse می کند.
    انگلیسی، اعداد، علائم و ایمیل دست نمی خورند.
    """

    def replace(match):
        value = match.group(0)

        return value[::-1]


    return PERSIAN_PATTERN.sub(
        replace,
        text
    )



# =====================================================
# Extract PDF Text
# =====================================================

def extract_pdf_text(pdf_path):

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(
            f"PDF not found: {pdf_path}"
        )


    document = fitz.open(
        pdf_path
    )

    result = []


    for page_number, page in enumerate(document):

        text = page.get_text(
            "text"
        )


        fixed = reverse_persian_parts(
            text
        )


        result.append(
            f"\n\n========== PAGE {page_number+1} ==========\n\n"
        )

        result.append(
            fixed
        )


    document.close()


    return "".join(result)



# =====================================================
# Save TXT
# =====================================================

def save_text(
    text,
    output_path
):

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(
            text
        )



# =====================================================
# Main
# =====================================================

if __name__ == "__main__":


    pdf_file = r"G:\SmartOps\backend\smartops-final-test.pdf"


    output_file = r"G:\SmartOps\backend\smartops-text-output.txt"


    extracted_text = extract_pdf_text(
        pdf_file
    )


    save_text(
        extracted_text,
        output_file
    )


    print(
        "DONE"
    )

    print(
        "Output:",
        output_file
    )