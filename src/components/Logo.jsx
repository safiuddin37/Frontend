import { Link } from 'react-router-dom'
import { assets} from '../assets/assets'
const Logo = ({ useLink = true }) => {
  const content = (
    <>
      <img 
        src={assets.logo}
        alt="Logo" 
        className="h-20 w-auto mr-6" 
      />
      <span className="text-xl font-poppins font-bold text-black drop-shadow-lg">
        <span className="text-accent-600 drop-shadow-md">Mohalla</span> Tuition Center Program
      </span>
    </>
  );

  return useLink ? (
    <Link to="/" className="flex items-center">
      {content}
    </Link>
  ) : (
    <div className="flex items-center">
      {content}
    </div>
  );
}

export default Logo
