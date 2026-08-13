==================================================
PROJECT ASSETS — STRICT RULES
==================================================

IMPORTANT:
The project already contains official client-provided assets.

DO NOT generate, invent, replace, or download alternative images when an appropriate project asset already exists.

ASSET FOLDERS:

1. PRODUCT IMAGES

All T-shirt/jersey product images are located inside:

ZYRO_Wear_Studio_Imgs/

Use these images for:
- Product cards
- Product detail pages
- Product galleries
- Featured products
- New arrivals
- Best sellers
- Cart
- Checkout
- Admin product management

IMPORTANT:
- Use the existing product images exactly as provided.
- Do not generate AI replacement product images.
- Do not use random stock images.
- Do not replace product images with placeholder images if the correct project image exists.
- Do not duplicate the same product image unnecessarily.
- If multiple images of the same product exist, use them as the product gallery.
- Keep front/back images associated with the correct product.
- Preserve image quality and aspect ratio.
- Use Next.js Image for optimization.

Before creating product data, inspect the ZYRO_Wear_Studio_Imgs folder and identify all available product images.

Do not assume filenames.
Read the actual files and organize them correctly.

--------------------------------------------------

2. ZYRO LOGO AND REVIEW ASSETS

Official ZYRO branding assets and customer review assets are located inside:

logo and review/

Use the existing assets from this folder.

The ZYRO logo must be used wherever appropriate:
- Navbar
- Footer
- Hero section
- Brand sections
- Admin branding where appropriate

Do NOT create a new ZYRO logo.

--------------------------------------------------

3. CUSTOMER REVIEWS

The existing review images inside:

logo and review/

must be used for the Reviews/Testimonials section.

IMPORTANT:
- Use the provided review images.
- Do NOT generate new review images.
- Do NOT create fake customer reviews.
- Do NOT invent customer names.
- Do NOT invent phone numbers.
- Do NOT display phone numbers in the review section.
- Do NOT modify or fabricate review content.
- Do NOT create WhatsApp-style fake conversations.
- Do NOT add random customer information.

If a provided review image contains sensitive or unnecessary information such as a phone number, do not reproduce that number as text elsewhere on the website.

Use the provided review asset visually where appropriate.

--------------------------------------------------

4. WEBSITE DESIGN REFERENCES

All website design references, theme references, layouts, visual references, and prototype images are located inside:

Website Refrance/

IMPORTANT:

Before designing the UI:
- Inspect the Website Refrance folder.
- Study the provided references.
- Follow the visual direction, layout ideas, spacing, typography, color palette, product presentation, and overall design language from the references.

The references are the primary visual direction for the website.

Do NOT blindly copy another website.

Do NOT introduce a completely different visual style.

Adapt the reference design specifically for ZYRO Wear.

--------------------------------------------------

5. NO AI-GENERATED ASSETS

STRICT RULE:

Do NOT generate new images for the website when a suitable asset already exists inside the project folders.

Do NOT use:
- AI-generated product photos
- Random stock photos
- Random T-shirt images
- Random model photos
- Random logos
- Random customer review graphics
- Random brand graphics

Use the client-provided project assets first.

Only create a placeholder when an asset genuinely does not exist and the placeholder is technically necessary during development.

Before production, remove all placeholders.

--------------------------------------------------

6. NO DUPLICATE ASSETS

Before adding an image:
- Check whether the image already exists in the project.
- Do not copy the same image into multiple folders.
- Do not create duplicate product files.
- Do not generate a second version of an existing product image.

Use references/paths to the original asset where possible.

--------------------------------------------------

7. PRODUCT IMAGE ORGANIZATION

When inspecting:

ZYRO_Wear_Studio_Imgs/

Identify:
- Product name
- Front image
- Back image
- Additional product images
- Product category

Create a clean mapping between products and their images.

Example:

Product:
Norway Home Jersey

Images:
- Norway_Home_Front.png
- Norway_Home_Haaland_9_Back.png

Do not mix images between different products.

--------------------------------------------------

8. IMAGE DISPLAY RULES

For product images:
- Use object-fit: contain where appropriate.
- Maintain the original aspect ratio.
- Do not stretch images.
- Do not crop important product details.
- Do not distort logos, text, patterns, or jersey designs.
- Use a consistent product-image container across product cards.
- Allow different source image dimensions without breaking the layout.

--------------------------------------------------

9. ASSET-FIRST DEVELOPMENT RULE

Before creating any visual component:

1. Check the project asset folders.
2. Identify whether the required asset already exists.
3. Use the existing asset if available.
4. Only create a placeholder if absolutely necessary.
5. Never replace a provided client asset with an AI-generated alternative.

The client's provided assets always have priority over generated or external assets.

==================================================
ASSET SOURCES
==================================================

PRODUCTS:
ZYRO_Wear_Studio_Imgs/

LOGO + REVIEWS:
logo and review/

WEBSITE DESIGN REFERENCES:
Website Refrance/

These folders are part of the project and must be inspected before implementing the corresponding sections.