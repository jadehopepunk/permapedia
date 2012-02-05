Array
class Array
  def non_blank
    reject(&:blank?)
  end  
end