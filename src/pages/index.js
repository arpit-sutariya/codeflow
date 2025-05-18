import Image from "next/image";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();

  return (
    <div
      className={`flex items-center h-screen justify-center ${inter.className}`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to CodeFlow
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Your online code editor for quick and efficient coding.
          </p>
        </div>

        <div className="mb-8">
          <Image
            src="/main-logo.png"
            alt="CodeFlow Logo"
            className="filter brightness-150 contrast-200"
            width={160}
            height={160}
          />
        </div>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          onClick={() => router.push("/compiler")}
        >
          Open Editor
        </button>

        <div className="mt-8 text-center text-gray-600">
          <p>
            Start coding now or explore our features. Get ready to build amazing
            projects!
          </p>
        </div>
      </div>
    </div>
  );
}
