Permapedia::Application.routes.draw do
  resources :plants

  match 'home', :to => 'home#index'
  root :to => 'home#index'
end
