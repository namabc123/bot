import Header from "../components/Header/BasicHeader/Header";
import Footer from "../components/Footer/BasicFooter/Footer";

export default function RootLayout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
